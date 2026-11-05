import { randomUUID } from 'node:crypto';
import { topics, skills, days, routes, defaultSegments } from '../public/content.js';

export class InputError extends Error {
  constructor(message, status = 422) { super(message); this.status = status; }
}
const requireThat = (condition, message, status) => { if (!condition) throw new InputError(message, status); };
function text(value, name, max = 160, optional = false) {
  requireThat(typeof value === 'string', `${name} must be text.`);
  const s = value.trim();
  requireThat((optional || s.length > 0) && s.length <= max, `${name} must contain ${optional ? 'at most' : '1 to'} ${max} characters.`);
  requireThat(!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s), `${name} contains an unsupported character.`);
  return s;
}
function number(value, name, min, max) {
  requireThat(Number.isInteger(value) && value >= min && value <= max, `${name} must be a whole number from ${min} to ${max}.`);
  return value;
}
function oneOf(value, options, name) { requireThat(options.includes(value), `${name} is not recognised.`); return value; }
const id = () => randomUUID();
export function validDate(value) {
  requireThat(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value), 'Choose a valid date.');
  const date = new Date(`${value}T00:00:00Z`);
  requireThat(!Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value && +value.slice(0, 4) >= 2020 && +value.slice(0, 4) <= 2100, 'Choose a valid date.');
  return value;
}
export function minutes(value) {
  requireThat(typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value), 'Times must use HH:MM.');
  return +value.slice(0, 2) * 60 + +value.slice(3);
}
export function dayOf(date) { return days[(new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7]; }
export function hkDate(now = new Date()) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Hong_Kong', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now); }
export function makeSeed(now = new Date()) {
  const date = hkDate(now);
  const avail = days.map(day => ({ day, start: '14:00', end: '20:00' }));
  const learners = [
    ['Maya', 'Harbour View Primary', 'P5', [1, 2, 2, 3, 3], 'Sentence building', 'Centre tablet'],
    ['Leo', 'Banyan Primary', 'P6', [4, 3, 3, 2, 3], 'Listening for detail', 'Own device'],
    ['Amir', 'Harbour View Primary', 'P5', [2, 2, 1, 3, 2], 'Organising ideas', 'Print preferred'],
    ['Chloe', 'Hilltop Primary', 'P4', [2, 1, 2, 2, 3], 'Connecting ideas', 'Shared device'],
    ['Noah', 'Banyan Primary', 'P6', [3, 4, 3, 3, 4], 'Explaining reasoning', 'Own device'],
    ['Sophie', 'Hilltop Primary', 'P5', [3, 2, 2, 1, 3], 'Listening confidence', 'Centre tablet']
  ].map(([alias, school, grade, values, focus, access], i) => ({ id: `learner-${i + 1}`, alias, school, grade, skills: Object.fromEntries(skills.map((s, j) => [s, values[j]])), focus, access, availability: avail, createdAt: now.toISOString() }));
  const lesson = { id: 'lesson-starter', title: 'Small habits, big days', topicId: 'daily-routines', skill: 'Grammar', objective: topics[0].objective, instructions: topics[0].core, route: 'Core', learnerIds: learners.slice(0, 4).map(l => l.id), duration: 60, segments: defaultSegments(), teacherNotes: 'Compare I walk and she walks before moving to questions with does.', approved: false, createdAt: now.toISOString() };
  return {
    learners, lessons: [lesson],
    sessions: [
      { id: 'session-starter', title: 'Everyday English', date, start: '16:00', end: '17:00', room: 'Room A', teacher: 'Teacher A', capacity: 6, communitySeats: 1, learnerIds: learners.slice(0, 4).map(l => l.id), lessonId: lesson.id, noise: 'Conversation', buffer: 10 },
      { id: 'session-reading', title: 'Reading & reasoning', date, start: '17:15', end: '18:15', room: 'Room A', teacher: 'Teacher A', capacity: 6, communitySeats: 1, learnerIds: learners.slice(4).map(l => l.id), lessonId: '', noise: 'Quiet', buffer: 10 }
    ], reflections: [], impactLogs: [], audit: [], sample: true
  };
}
function memberIds(value, state) {
  requireThat(Array.isArray(value) && value.length <= 40 && new Set(value).size === value.length, 'Choose each learner once, up to 40 learners.');
  requireThat(value.every(v => state.learners.some(l => l.id === v)), 'A selected learner no longer exists.');
  return [...value];
}
export function validateLearner(input, state) {
  const alias = text(input.alias, 'Learner alias', 40);
  requireThat(!state.learners.some(l => l.alias.toLowerCase() === alias.toLowerCase()), 'Use a different alias for each learner.');
  requireThat(Array.isArray(input.availability) && input.availability.length >= 1 && input.availability.length <= 7, 'Add between one and seven availability windows.');
  const availability = input.availability.map(a => {
    const day = oneOf(a.day, days, 'Day'); const start = minutes(a.start); const end = minutes(a.end);
    requireThat(end > start, 'Availability must end after it starts.'); return { day, start: a.start, end: a.end };
  });
  return { id: id(), alias, school: text(input.school || 'Not recorded', 'School', 100), grade: oneOf(input.grade, ['P4', 'P5', 'P6'], 'Grade'), focus: text(input.focus || '', 'Learning focus', 180, true), access: oneOf(input.access, ['Own device', 'Shared device', 'Centre tablet', 'Print preferred'], 'Access preference'), skills: Object.fromEntries(skills.map(s => [s, 0])), availability, createdAt: new Date().toISOString() };
}
export function validateLesson(input, state) {
  const topic = topics.find(t => t.id === input.topicId);
  requireThat(topic, 'Choose an available activity.');
  const duration = number(input.duration, 'Lesson length', 20, 120);
  requireThat(Array.isArray(input.segments) && input.segments.length >= 3 && input.segments.length <= 10, 'Use between 3 and 10 lesson segments.');
  const segments = input.segments.map(s => ({ title: text(s.title, 'Segment title', 80), minutes: number(s.minutes, 'Segment minutes', 1, 90) }));
  requireThat(segments.reduce((total, s) => total + s.minutes, 0) === duration, 'Segment minutes must add up to the lesson length.');
  return { id: id(), title: text(input.title, 'Lesson title', 100), topicId: topic.id, skill: topic.skill, objective: text(input.objective, 'Learning objective', 500), instructions: text(input.instructions, 'Instructions', 2000), route: oneOf(input.route, routes, 'Learning route'), learnerIds: memberIds(input.learnerIds, state), duration, segments, teacherNotes: text(input.teacherNotes || '', 'Teacher notes', 2000, true), approved: input.approved === true, createdAt: new Date().toISOString() };
}
export function validateSession(input, state) {
  const date = validDate(input.date); const start = minutes(input.start); const end = minutes(input.end);
  requireThat(end > start && end - start <= 180, 'Sessions must last between 1 and 180 minutes on the same day.');
  requireThat(start >= 8 * 60 && end <= 21 * 60, 'This pilot supports classes from 08:00 to 21:00.');
  const capacity = number(input.capacity, 'Capacity', 1, 40);
  const communitySeats = number(input.communitySeats, 'Reserved community places', 0, capacity);
  const learnerIds = memberIds(input.learnerIds, state);
  requireThat(learnerIds.length + communitySeats <= capacity, 'Learners and reserved community places exceed room capacity.');
  const room = oneOf(input.room, ['Room A', 'Room B'], 'Room');
  const teacher = oneOf(input.teacher || 'Teacher A', ['Teacher A', 'Teacher B'], 'Teacher');
  const buffer = number(input.buffer, 'Arrival buffer', 5, 30);
  requireThat(input.lessonId === '' || state.lessons.some(l => l.id === input.lessonId), 'Choose a saved lesson.');
  for (const existing of state.sessions.filter(s => s.date === date && !s.cancelled)) {
    const shared = learnerIds.some(l => existing.learnerIds.includes(l));
    const sameTeacher = (existing.teacher || 'Teacher A') === teacher;
    if (existing.room === room || shared || sameTeacher) {
      const gap = Math.max(buffer, existing.buffer);
      requireThat(end + gap <= minutes(existing.start) || start >= minutes(existing.end) + gap, shared ? 'A selected learner has another class or arrival buffer at this time.' : existing.room === room ? `${room} needs a ${gap}-minute changeover between classes.` : `${teacher} has another class or changeover buffer at this time.`, 409);
    }
  }
  for (const learner of state.learners.filter(l => learnerIds.includes(l.id))) {
    requireThat(learner.availability.some(a => a.day === dayOf(date) && start >= minutes(a.start) && end <= minutes(a.end)), `${learner.alias} is unavailable at this time.`, 409);
  }
  return { id: id(), title: text(input.title, 'Class name', 100), date, start: input.start, end: input.end, room, teacher, capacity, communitySeats, learnerIds, lessonId: input.lessonId, noise: oneOf(input.noise, ['Quiet', 'Conversation'], 'Activity type'), buffer };
}
export function validateReflection(input, state) {
  const session = state.sessions.find(s => s.id === input.sessionId);
  requireThat(session, 'Choose a class.');
  requireThat(state.learners.some(l => l.id === input.learnerId) && session.learnerIds.includes(input.learnerId), 'Choose a learner enrolled in this class.');
  return { id: id(), sessionId: session.id, learnerId: input.learnerId, skill: oneOf(input.skill, skills, 'Skill'), level: number(input.level, 'Observed learning', 1, 4), engagement: number(input.engagement, 'Observed engagement', 1, 5), evidence: text(input.evidence, 'Learning evidence', 1000), nextStep: text(input.nextStep, 'Next teaching step', 1000), teachingReflection: text(input.teachingReflection, 'Teaching reflection', 1000), createdAt: new Date().toISOString() };
}
export function validateImpact(input) {
  const record = { id: id(), date: validDate(input.date), note: text(input.note, 'Evidence source', 1000), createdAt: new Date().toISOString() };
  for (const field of ['baselineSheets', 'actualSheets', 'baselineMinutes', 'actualMinutes', 'placesOffered', 'placesUsed', 'neighbourIncidents']) record[field] = number(input[field], field.replace(/([A-Z])/g, ' $1').toLowerCase(), 0, 10000);
  requireThat(record.placesUsed <= record.placesOffered, 'Community places used cannot exceed places offered.');
  return record;
}
export function impactSummary(state) {
  const logs = state.impactLogs;
  const sum = key => logs.reduce((s, l) => s + l[key], 0);
  return { records: logs.length, sheetDifference: sum('baselineSheets') - sum('actualSheets'), minuteDifference: sum('baselineMinutes') - sum('actualMinutes'), placesOffered: sum('placesOffered'), placesUsed: sum('placesUsed'), incidents: sum('neighbourIncidents'), carbonKg: null, outcomeVerified: false };
}
export function applyAction(state, type, input) {
  const next = structuredClone(state);
  if (type === 'session-update' || type === 'session-cancel') {
    const existing = next.sessions.find(s => s.id === input.id);
    requireThat(existing, 'This class no longer exists.', 404);
    if (type === 'session-cancel') existing.cancelled = true;
    else {
      requireThat(!existing.cancelled, 'A cancelled class cannot be edited. Plan a new class.');
      const validated = validateSession(input, { ...next, sessions: next.sessions.filter(s => s.id !== input.id) });
      Object.assign(existing, validated, { id: input.id });
    }
    next.audit.unshift({ id: id(), action: type === 'session-cancel' ? 'class cancelled' : 'class rescheduled', at: new Date().toISOString() });
    next.audit = next.audit.slice(0, 100);
    return { state: next, record: existing };
  }
  const definitions = { learner: ['learners', validateLearner, 40], lesson: ['lessons', validateLesson, 100], session: ['sessions', validateSession, 100], reflection: ['reflections', validateReflection, 500], impact: ['impactLogs', validateImpact, 100] };
  const def = definitions[type]; requireThat(def, 'Unknown action.', 404);
  const [collection, validator, limit] = def;
  requireThat(next[collection].length < limit, `The demo limit for ${collection} has been reached. Start a new demonstration workspace.`);
  const record = validator(input, next); next[collection].push(record);
  if (type === 'reflection') next.learners.find(l => l.id === record.learnerId).skills[record.skill] = record.level;
  next.audit.unshift({ id: id(), action: `${type} added`, at: new Date().toISOString() }); next.audit = next.audit.slice(0, 100);
  return { state: next, record };
}
