import test from 'node:test';
import assert from 'node:assert/strict';
import { makeSeed, validateSession, validateLesson, validateLearner, applyAction, impactSummary, validDate, hkDate } from '../server/domain.mjs';
import { topics, defaultSegments, routeFor } from '../public/content.js';

const seed = () => makeSeed(new Date('2026-11-05T06:00:00Z'));
const booking = overrides => ({ title: 'Practice class', date: '2026-11-05', start: '18:30', end: '19:30', room: 'Room B', teacher: 'Teacher B', capacity: 6, communitySeats: 1, learnerIds: ['learner-1'], lessonId: '', noise: 'Quiet', buffer: 10, ...overrides });

test('Hong Kong date handles midnight independently of server timezone', () => { assert.equal(hkDate(new Date('2026-11-05T16:10:00Z')), '2026-11-06'); });
test('invalid calendar dates are rejected', () => { for (const date of ['2026-02-30', '2026-13-01', '2026-11-05T00:00:00Z', '1999-01-01']) assert.throws(() => validDate(date)); });
test('room and teacher and learner conflicts are checked across rooms', () => {
  assert.throws(() => validateSession(booking({ start: '16:00', end: '17:00', room: 'Room A', learnerIds: [] }), seed()), /changeover/);
  assert.throws(() => validateSession(booking({ start: '16:00', end: '17:00', teacher: 'Teacher A', learnerIds: [] }), seed()), /Teacher A/);
  assert.throws(() => validateSession(booking({ start: '16:00', end: '17:00' }), seed()), /learner/);
});
test('the larger buffer is enforced on either side of a class', () => {
  assert.throws(() => validateSession(booking({ start: '18:20', end: '19:20', room: 'Room A', learnerIds: [], buffer: 15 }), seed()), /15-minute/);
  assert.doesNotThrow(() => validateSession(booking({ start: '18:30', end: '19:30', room: 'Room A', learnerIds: [], buffer: 15 }), seed()));
});
test('community places count against capacity', () => { assert.throws(() => validateSession(booking({ capacity: 1, communitySeats: 1 }), seed()), /exceed/); });
test('availability must cover the whole class and unknown learners are rejected', () => {
  assert.throws(() => validateSession(booking({ start: '19:30', end: '20:30' }), seed()), /unavailable/);
  assert.throws(() => validateSession(booking({ learnerIds: ['other-workspace-learner'] }), seed()), /no longer exists/);
});
test('a learner starts with no invented skill observations', () => {
  const l = validateLearner({ alias: 'Robin', school: 'Sample School', grade: 'P5', focus: '', access: 'Print preferred', availability: [{ day: 'Saturday', start: '14:00', end: '18:00' }] }, seed());
  assert.ok(Object.values(l.skills).every(v => v === 0)); assert.equal(routeFor(0), 'Support');
});
test('the lesson rhythm always adds up and does not permit negative segments', () => {
  for (const duration of [20, 30, 45, 60, 90, 120]) assert.equal(defaultSegments(duration).reduce((n, s) => n + s.minutes, 0), duration);
  const lesson = { ...seed().lessons[0], duration: 45 };
  assert.throws(() => validateLesson(lesson, seed()), /add up/);
  lesson.segments[0].minutes = -10; assert.throws(() => validateLesson(lesson, seed()), /whole number/);
});
test('a reflection updates only the chosen skill and preserves specific evidence', () => {
  const old = seed(); const result = applyAction(old, 'reflection', { sessionId: 'session-starter', learnerId: 'learner-1', skill: 'Grammar', level: 3, engagement: 4, evidence: 'Chose walks and explained the subject.', nextStep: 'Try a question with does.', teachingReflection: 'Allow more time to explain.' });
  assert.equal(result.state.learners[0].skills.Grammar, 3); assert.equal(result.state.learners[0].skills.Listening, old.learners[0].skills.Listening);
  assert.equal(old.learners[0].skills.Grammar, 1); assert.equal(result.state.reflections.length, 1);
  assert.throws(() => applyAction(old, 'reflection', { ...result.record, learnerId: 'learner-6' }), /enrolled/);
});
test('rescheduling validates against other sessions while preserving the class id', () => {
  const old = seed(); const b = { ...old.sessions[0], start: '14:00', end: '15:00' };
  const result = applyAction(old, 'session-update', b);
  assert.equal(result.record.id, 'session-starter'); assert.equal(result.state.sessions.length, 2);
  assert.throws(() => applyAction(old, 'session-update', { ...b, start: '17:30', end: '18:30' }), /changeover/);
});
test('cancelling a class preserves history and frees its capacity', () => {
  const cancelled = applyAction(seed(), 'session-cancel', { id: 'session-starter' }).state;
  assert.equal(cancelled.sessions[0].cancelled, true);
  assert.doesNotThrow(() => validateSession(booking({ room: 'Room A', start: '16:00', end: '17:00' }), cancelled));
});
test('impact begins unmeasured; increases are signed and no carbon is invented', () => {
  const old = seed(); assert.equal(impactSummary(old).records, 0);
  const result = applyAction(old, 'impact', { date: '2026-11-05', baselineSheets: 10, actualSheets: 15, baselineMinutes: 20, actualMinutes: 25, placesOffered: 2, placesUsed: 1, neighbourIncidents: 1, note: 'Demonstration timer and print log.' });
  const summary = impactSummary(result.state); assert.equal(summary.sheetDifference, -5); assert.equal(summary.minuteDifference, -5); assert.equal(summary.carbonKg, null); assert.equal(summary.outcomeVerified, false);
  assert.throws(() => applyAction(old, 'impact', { ...result.record, placesUsed: 3 }), /cannot exceed/);
});
test('all curated items have unique options and a valid answer and explanation', () => {
  for (const t of topics) { assert.ok(t.objective && t.support && t.core && t.stretch && t.exit && t.rubric.length); for (const q of t.questions) { assert.equal(new Set(q.options).size, q.options.length); assert.ok(q.answer >= 0 && q.answer < q.options.length && q.why); } }
  assert.equal(topics.find(t => t.skill === 'Writing').questions.length, 0);
});
