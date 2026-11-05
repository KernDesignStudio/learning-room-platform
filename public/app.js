import { API_ORIGIN } from './config.js';
import { topics, skills, levels, routes, days, routeFor, defaultSegments } from './content.js';
import { planPage } from './plan.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const STORAGE = 'learning-room.workspace.v1';
let token = null;
try { token = localStorage.getItem(STORAGE); } catch {}
let state = null, revision = 0, impact = null, expiresAt = '', busy = false;
let view = '', topicId = 'daily-routines', route = 'Core', selectedLearners = new Set(), previewAnswers = {}, previewChecked = false;
let editingLesson = null, learnersQuery = '', schoolFilter = 'All schools', modalReturnFocus = null, lessonDirty = false;
const labels = { today: 'Today', studio: 'Lesson studio', learners: 'Learners', timetable: 'Timetable', reflections: 'Reflection', impact: 'Impact register' };
const hkDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Hong_Kong', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const dateLabel = date => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
const shortDate = date => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const topic = () => topics.find(t => t.id === topicId) || topics[0];
const learnerName = id => state.learners.find(l => l.id === id)?.alias || 'Unknown learner';
const levelClass = value => ['unobserved', 'support', 'developing', 'secure', 'stretch'][value || 0];
const button = (text, action, cls = 'button', extra = '') => `<button type="button" class="${cls}" data-action="${action}" ${extra}>${text}</button>`;
const empty = (title, text, action = '') => `<div class="empty-state"><h3>${title}</h3><p>${text}</p>${action}</div>`;

function notify(message, error = false) {
  const toast = $('#toast'); toast.textContent = message; toast.classList.toggle('error', error); toast.classList.add('visible');
  clearTimeout(notify.timer); notify.timer = setTimeout(() => toast.classList.remove('visible'), error ? 9000 : 5000);
}
async function request(path, method = 'GET', data) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  let response;
  try { response = await fetch(`${API_ORIGIN}${path}`, { method, headers, body: data ? JSON.stringify(data) : undefined, signal: AbortSignal.timeout(15000) }); }
  catch { throw new Error('The teaching service is unavailable. Your current form is still here. Please try again.'); }
  let body;
  try { body = await response.json(); } catch { throw new Error('The service returned an unreadable response. Please try again.'); }
  if (!response.ok) { const error = new Error(body.error || 'The request could not be completed.'); error.status = response.status; throw error; }
  return body;
}
function accept(body) { state = body.state; revision = body.revision; impact = body.impact; expiresAt = body.expiresAt; }
async function ensureWorkspace() {
  if (state) return;
  if (token) {
    try { accept(await request('/api/workspace')); return; }
    catch (error) { if (error.status !== 401) throw error; token = null; try { localStorage.removeItem(STORAGE); } catch {} }
  }
  const body = await request('/api/workspaces', 'POST'); token = body.token; accept(body);
  try { localStorage.setItem(STORAGE, token); }
  catch { notify('Browser storage is unavailable. Keep this tab open to retain access to your demo.', true); }
}
async function mutate(type, data) {
  const body = await request(`/api/${type}`, 'POST', { revision, data }); accept(body); return body.record;
}
function select(name, value, options, label, extra = '') {
  const list = options.map(o => typeof o === 'string' ? { value: o, label: o } : o);
  const selected = list.find(o => String(o.value) === String(value));
  return `<div class="select" data-select ${extra}><input type="hidden" name="${name}" value="${esc(value)}"><button type="button" class="select-toggle" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-label="${esc(label)}"><span>${esc(selected?.label || 'Choose an option')}</span><span class="select-mark" aria-hidden="true">+</span></button><div class="select-options" role="listbox" aria-label="${esc(label)}" hidden>${list.map(o => `<button type="button" role="option" aria-selected="${String(o.value) === String(value)}" data-option="${esc(o.value)}" tabindex="-1">${esc(o.label)}</button>`).join('')}</div></div>`;
}
function field(label, name, value = '', opts = {}) {
  return `<label class="field ${opts.cls || ''}"><span>${label}${opts.optional ? ' <span class="muted">(optional)</span>' : ''}</span><input name="${name}" type="${opts.type || 'text'}" value="${esc(value)}" ${opts.required === false ? '' : 'required'} ${opts.max ? `maxlength="${opts.max}"` : ''} ${opts.min !== undefined ? `min="${opts.min}"` : ''} ${opts.maxN !== undefined ? `max="${opts.maxN}"` : ''} ${opts.placeholder ? `placeholder="${esc(opts.placeholder)}"` : ''} ${opts.inputmode ? `inputmode="${opts.inputmode}"` : ''} autocomplete="off">${opts.hint ? `<small>${opts.hint}</small>` : ''}</label>`;
}
function area(label, name, value = '', opts = {}) {
  return `<label class="field ${opts.cls || ''}"><span>${label}${opts.optional ? ' <span class="muted">(optional)</span>' : ''}</span><textarea name="${name}" rows="${opts.rows || 3}" maxlength="${opts.max || 2000}" ${opts.optional ? '' : 'required'}>${esc(value)}</textarea>${opts.hint ? `<small>${opts.hint}</small>` : ''}</label>`;
}
function learnerChecks(ids = [], cls = '') {
  return `<div class="learner-checks ${cls}">${state.learners.map(l => `<label class="check-row"><input type="checkbox" name="learnerIds" value="${esc(l.id)}" ${ids.includes(l.id) ? 'checked' : ''}><span><strong>${esc(l.alias)}</strong><small>${esc(l.grade)} · ${esc(l.school)}</small></span></label>`).join('')}</div>`;
}
function header(title, description, action = '') {
  return `<div class="page-heading"><div><h1>${title}</h1><p>${description}</p></div>${action}</div>`;
}
function shell(content) {
  return `<div class="workspace" data-ui><aside class="sidebar"><a class="wordmark" href="#/">Learning<br>Room<span class="wordmark-dot">.</span></a><p class="sidebar-caption">A little room to grow.</p><nav aria-label="Teaching workspace">${Object.entries(labels).map(([id, label]) => `<a href="#/${id}" ${view === id ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</nav><div class="sidebar-bottom"><a href="#/plan">The product plan</a><div class="sample-note"><strong>A teaching pilot</strong><p>Fictional learners.<br>Your own demo workspace.</p>${button('About this demo', 'about', 'text-button light')}</div></div></aside><div class="workspace-body"><header class="topbar"><a class="mobile-wordmark" href="#/">Learning Room.</a><span class="workspace-crumb">Your workspace <span>/</span> ${labels[view] || 'Practice preview'}</span><div class="topbar-actions"><span class="connection"><i aria-hidden="true"></i> Connected</span>${button('Export', 'export', 'text-button')}</div></header><nav class="mobile-nav" aria-label="Teaching sections">${Object.entries(labels).map(([id, label]) => `<a href="#/${id}" ${view === id ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</nav><main id="main" class="workspace-main" tabindex="-1"><div class="demo-banner"><span>Demonstration workspace. Use fictional information only.</span><span>Hong Kong time</span></div>${content}</main><footer class="workspace-footer"><span>Made for thoughtful teaching.</span><span>Saved on the teaching server · Demo expires 7 days after its last save</span></footer></div></div>`;
}
function home() {
  return `<div class="marketing"><header class="site-header"><a class="site-wordmark" href="#/">Learning Room.</a><nav aria-label="Product"><a href="#/plan">Product plan</a><a href="#/impact-story">Impact</a><a class="button jade" href="#/today">Open workspace</a></nav></header><main id="main"><section class="hero"><h1>Room for every learner</h1><p>One teaching workspace for differentiated English lessons, learner progress and a more thoughtful learning centre.</p><a class="button jade" href="#/today">Open workspace</a><span class="hero-note">A working pilot with fictional data. No sign-up needed.</span><div class="folder-stack"><div class="folder-strip strip-learners"><span>Learners</span></div><div class="folder-strip strip-rhythm"><span>Lesson rhythm</span></div><div class="folder-strip strip-impact"><span>Community impact</span></div><div class="folder-front"><div class="folder-tab">Your teaching day</div><picture><source media="(max-width: 650px)" srcset="assets/workspace-mobile.webp"><img class="hero-screen" src="assets/workspace.webp" width="1440" height="900" alt="The Learning Room workspace showing a class, learner support routes and a lesson rhythm" fetchpriority="high"></picture><div class="folder-caption"><span>One shared objective. Different ways to get there.</span><a href="#/studio">Try the lesson studio</a></div></div></div></section><section class="product-story"><div class="story-copy"><h2>Same goal.<br>Room to grow.</h2><p>Keep one learning objective while changing the scaffolding. Choose Support, Core or Stretch, edit the notes and see exactly what a learner will practise.</p><p>Optional challenges recognise extra thinking. Core learning stays visible on its own.</p><a class="button jade" href="#/studio">Prepare a lesson</a></div><div class="story-image"><img src="assets/studio.webp" width="1440" height="900" loading="lazy" alt="The lesson studio with curated grammar content and Support, Core and Stretch routes"></div></section><section class="learner-story"><div class="story-image"><img src="assets/learners.webp" width="1440" height="900" loading="lazy" alt="Learner skill profiles showing separate observations for grammar, sentence structure, writing, listening and reading"></div><div class="story-copy"><h2>Know each<br>learner.</h2><p>A learner can be confident in reading and need help with listening. Keep those observations separate, alongside their school, availability and access needs.</p><p>Review what happened in a lesson, what supported engagement and what you will change next time.</p><a class="text-link" href="#/learners">Explore learner profiles</a></div></section><section class="impact-story" id="impact-story"><div class="story-copy"><h2>Evidence you<br>can inspect.</h2><p>Track print use against a recorded baseline, community places offered and used, and neighbour incidents. Keep the evidence and its limits together.</p><p>No carbon-neutral claim. No promised funding. A practical way to build an accountable pilot.</p><a class="button jade" href="#/impact">Open the impact register</a></div><div class="story-image"><img src="assets/impact.webp" width="1440" height="900" loading="lazy" alt="An impact register that starts with no measured results and explains its environmental, social and governance measures"></div></section><section class="pilot-letter"><h2>Start with a real classroom</h2><div><p>This pilot connects the teaching cycle with the everyday realities of a Hong Kong learning centre: mixed levels, different schools, shared devices and closely spaced classes.</p><p>The next step is a supervised pilot with teachers, a community partner and an independent education evaluator. Together, they can test whether it saves preparation time and improves access without weakening learning.</p><a class="text-link" href="#/plan">Read the product and pilot plan</a></div></section></main><footer class="site-footer"><div><p>A product pilot by KERN Design Studio.</p><a href="#/plan">Scope, evidence and funding routes</a></div><strong>Learning Room.</strong></footer></div>`;
}
function today() {
  const upcoming = [...state.sessions].filter(s => s.date >= hkDate() && !s.cancelled).sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
  const next = upcoming[0] || state.sessions.at(-1);
  const lesson = state.lessons.find(l => l.id === next?.lessonId);
  const selected = state.learners.filter(l => next?.learnerIds.includes(l.id));
  const needs = state.learners.flatMap(l => skills.filter(s => l.skills[s] === 1).map(s => ({ learner: l, skill: s }))).slice(0, 3);
  return `${header('Today, with room to grow.', dateLabel(hkDate()), '<a href="#/studio" class="button primary">Prepare a lesson</a>')}<div class="overview-grid"><section class="lesson-paper"><div class="paper-meta"><span>Next on your timetable</span><span>${next ? `${shortDate(next.date)} · ${next.start} to ${next.end}` : 'No classes planned'}</span></div><h2>${esc(next?.title || 'Make space for a lesson')}</h2><p class="paper-description">${esc(lesson?.objective || 'Choose a shared objective and make it work for your group.')}</p><div class="class-meta"><span>${esc(next?.room || 'Choose a room')}</span><span>${selected.length} learners</span><span>${new Set(selected.map(l => l.school)).size} schools</span></div><div class="learner-route-list">${selected.map(l => `<div><span class="avatar ${levelClass(l.skills[lesson?.skill || 'Grammar'])}">${esc(l.alias.slice(0, 1))}</span><span>${esc(l.alias)} <small>${esc(l.grade)}</small></span><span class="route-label ${levelClass(l.skills[lesson?.skill || 'Grammar'])}">${routeFor(l.skills[lesson?.skill || 'Grammar'])}</span></div>`).join('')}</div><div class="paper-bottom"><span>Suggested routes for ${esc(lesson?.skill || 'Grammar')}. You decide.</span>${lesson ? button('Open lesson', 'open-lesson', 'button primary', `data-id="${lesson.id}"`) : '<a class="button primary" href="#/studio">Prepare lesson</a>'}</div></section><section class="support-sheet"><h2>Where support helps</h2><p>Begin with an observation.<br>Give it a next step.</p>${needs.length ? needs.map(n => `<div class="support-entry"><span class="avatar support">${esc(n.learner.alias[0])}</span><div><strong>${esc(n.learner.alias)}</strong><p>${esc(n.skill)}</p><small>${esc(n.learner.focus)}</small></div></div>`).join('') : '<p>Record an observation to identify the next teaching step.</p>'}<a class="text-link" href="#/learners">See every learner</a></section><section class="rhythm-sheet"><div class="section-title"><h2>A lesson with rhythm</h2><span>${lesson?.duration || 60} minutes</span></div><div class="rhythm-row">${(lesson?.segments || defaultSegments()).map((s, i) => `<div class="rhythm-part rhythm-${i}"><strong>${s.minutes}<small> min</small></strong><span>${esc(s.title)}</span></div>`).join('')}</div><p class="muted">A starting structure to adapt. Attention varies by learner, activity and context.</p></section><section class="day-list"><div class="section-title"><h2>Coming together</h2><a href="#/timetable">Timetable</a></div>${upcoming.slice(0, 3).map(s => `<div class="day-entry"><div><strong>${s.start}</strong><small>${shortDate(s.date)}</small></div><div><strong>${esc(s.title)}</strong><small>${esc(s.room)} · ${s.learnerIds.length}/${s.capacity} learners · ${s.buffer} min changeover</small></div><span class="activity-type">${esc(s.noise)}</span></div>`).join('') || '<p>No upcoming classes.</p>'}</section><section class="teaching-prompt"><h2>A moment to reflect</h2><p>What helped a learner take the next step? Keep the evidence and your teaching reflection in the same place.</p><a class="text-link" href="#/reflections">Record an observation</a></section></div>`;
}
function studio() {
  const t = topic(); const draft = editingLesson; const chosen = [...selectedLearners]; const duration = draft?.duration || 60;
  return `${header('One goal. Different routes.', 'Curated English activities, adapted and approved by you.')}<form data-form="lesson" class="studio-layout"><section class="studio-controls"><label class="field"><span>Activity</span>${select('topicId', t.id, topics.map(t => ({ value: t.id, label: t.title })), 'Activity', 'data-onchange="topic"')}</label><div class="activity-summary"><span class="skill-tag">${esc(t.skill)}</span><p>${esc(t.description)}</p><small>${t.grade} · Original curated sample</small></div><fieldset class="field"><legend>Who is this lesson for?</legend>${learnerChecks(chosen, 'studio-learners')}</fieldset><div class="route-help"><strong>Flexible groups</strong><p>Suggested routes use the latest observation for this skill. They are a starting point for your decision.</p><div class="route-counts">${routes.map(r => `<span>${r} <b>${state.learners.filter(l => chosen.includes(l.id) && routeFor(l.skills[t.skill]) === r).length}</b></span>`).join('')}</div></div>${button('Print learner note', 'print-note', 'button secondary print-note-button')}<h2>Saved lessons</h2><div class="saved-lessons">${state.lessons.map(l => button(`<strong>${esc(l.title)}</strong><small>${esc(l.skill)} · ${esc(l.route)} · ${l.approved ? 'Teacher approved' : 'Draft'}</small>`, 'open-lesson', 'saved-lesson', `data-id="${l.id}"`)).join('')}</div></section><section class="editor-paper"><div class="paper-meta"><span>${draft?.id ? 'Working copy of a saved lesson' : 'A fresh teaching note'}</span><span>${esc(t.skill)}</span></div><div class="route-tabs" role="group" aria-label="Activity route">${routes.map(r => button(r, 'route', `route-tab ${route === r ? 'active' : ''}`, `data-route="${r}" aria-pressed="${route === r}"`)).join('')}</div>${field('Lesson title', 'title', draft?.title || t.title, { max: 100 })}${area('Shared learning objective', 'objective', draft?.objective || t.objective, { rows: 2, max: 500 })}<div class="model-box"><h2>Model & think aloud</h2><p>${esc(t.model)}</p></div>${area(`${route} instructions`, 'instructions', draft?.instructions || t[route.toLowerCase()], { rows: 3 })}<div class="question-preview"><h2>${t.questions.length ? 'Practice with feedback' : 'Writing for teacher review'}</h2>${t.transcript ? `<div class="transcript"><strong>${t.skill === 'Listening' ? 'Listening message' : 'Reading text'}</strong><p>${esc(t.transcript)}</p>${t.skill === 'Listening' ? button('Play message', 'speak', 'button secondary') : ''}</div>` : ''}${t.questions.length ? t.questions.map(q => `<p class="question-line">${esc(q.stem)}</p>`).join('') : `<p>${esc(t.core)}</p><p class="muted">Writing is reviewed by a teacher against the rubric. No automatic writing score.</p>`}</div><div class="challenge-box"><h2>Optional stretch</h2><p>${esc(t.challenge)}</p><small>Recognise extra thinking separately. Core learning has its own evidence.</small></div><div class="pace-editor"><div class="section-title"><h2>Shape the lesson</h2>${select('duration', String(duration), ['30', '45', '60', '90'], 'Lesson length', 'data-onchange="duration"')}</div><p class="muted">Adjust each segment. The total must match your lesson length.</p><div class="segment-editor">${(draft?.segments || defaultSegments(duration)).map((s, i) => `<label><span>${esc(s.title)}</span><input type="number" name="segment-${i}" min="1" max="90" value="${s.minutes}" required aria-label="${esc(s.title)} minutes"><small>min</small></label>`).join('')}</div><p class="segment-total" aria-live="polite">${duration} of ${duration} minutes planned</p></div>${area('Teacher notes', 'teacherNotes', draft?.teacherNotes || `Watch for: ${t.misconception}`, { optional: true })}<label class="check-row approval"><input type="checkbox" name="approved" ${draft?.approved ? 'checked' : ''}><span>I have reviewed the objective, content and suitability for this group.</span></label><p class="form-error" role="alert" hidden></p><div class="editor-actions"><button class="button primary" type="submit">Save teaching note</button>${button('Learner preview', 'preview', 'button secondary')}<span>Saved as a new version.</span></div></section></form>`;
}
function skillCell(l, s) {
  const level = l.skills[s] || 0;
  return `<td><span class="skill-level ${levelClass(level)}"><span class="level-dots" aria-hidden="true">${[1, 2, 3, 4].map(n => `<i class="${n <= level ? 'filled' : ''}"></i>`).join('')}</span><span>${levels[level]}</span></span></td>`;
}
function learnerRows() {
  const query = learnersQuery.toLowerCase();
  const list = state.learners.filter(l => `${l.alias} ${l.school} ${l.focus}`.toLowerCase().includes(query) && (schoolFilter === 'All schools' || l.school === schoolFilter));
  return `<div class="table-scroll" tabindex="0" aria-label="Learner skill profiles. Scroll horizontally for all skills."><table class="learner-table"><caption class="sr-only">Latest teacher observations by skill. Starting records are fictional samples.</caption><thead><tr><th scope="col">Learner</th>${skills.map(s => `<th scope="col">${s}</th>`).join('')}<th scope="col">Profile</th></tr></thead><tbody>${list.map(l => `<tr><th scope="row"><span class="learner-identity"><span class="avatar">${esc(l.alias[0])}</span><span><strong>${esc(l.alias)}</strong><small>${esc(l.grade)} · ${esc(l.school)}</small></span></span></th>${skills.map(s => skillCell(l, s)).join('')}<td>${button('View', 'profile', 'text-button', `data-id="${l.id}" aria-label="View ${esc(l.alias)}’s profile"`)}</td></tr>`).join('')}</tbody></table></div>${!list.length ? empty('No matching learners', 'Try a different name, focus or school.') : ''}`;
}
function learners() {
  return `${header('Know the whole learner.', 'Different strengths, different schools. One clear next step.', button('Add learner', 'add-learner', 'button primary'))}<div class="learner-toolbar"><label class="search-field"><span class="sr-only">Search learners</span><input type="search" id="learner-search" placeholder="Search name, school or focus" value="${esc(learnersQuery)}"></label>${select('schoolFilter', schoolFilter, ['All schools', ...new Set(state.learners.map(l => l.school))], 'Filter by school', 'data-onchange="school"')}<span>${state.learners.length} learners · ${new Set(state.learners.map(l => l.school)).size} schools</span></div><section class="learner-sheet"><div id="learner-results">${learnerRows()}</div><div class="matrix-key"><span><i class="key-dot support"></i> Needs support</span><span><i class="key-dot developing"></i> Developing</span><span><i class="key-dot secure"></i> Secure</span><span><i class="key-dot stretch"></i> Ready to stretch</span></div><p class="muted">Observations describe a skill at a moment in time. They are not diagnoses or permanent ability groups.</p></section><section class="access-strip"><h2>Access belongs in the plan</h2><p>Record whether a learner uses a shared device, a centre tablet or prefers print. Keep financial circumstances out of learner-facing screens.</p><a class="text-link" href="#/timetable">Plan a class with community places</a></section>`;
}
function timetable() {
  const grouped = Object.groupBy([...state.sessions].sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`)), s => s.date);
  return `${header('A calmer change of class.', 'Match school schedules, protect changeover time and keep rooms within capacity.', button('Plan a class', 'add-session', 'button primary'))}<div class="timetable-layout"><section class="timetable-sheet">${Object.entries(grouped).map(([date, sessions]) => `<div class="schedule-day"><h2>${dateLabel(date)}</h2>${sessions.map(s => `<article class="schedule-entry ${s.noise.toLowerCase()}"><div class="schedule-time"><strong>${s.start}</strong><span>to ${s.end}</span><small>${s.buffer} min changeover</small></div><div class="schedule-detail"><h3>${esc(s.title)}</h3><p>${esc(s.room)} · ${esc(s.teacher || 'Teacher A')} · ${esc(s.noise)} activity${s.cancelled ? ' · Cancelled' : ''}</p><div class="schedule-names">${s.learnerIds.map(id => `<span>${esc(learnerName(id))}</span>`).join('')}</div><p class="muted">${s.learnerIds.length} enrolled · ${s.communitySeats} community ${s.communitySeats === 1 ? 'place' : 'places'} reserved · ${s.capacity - s.learnerIds.length - s.communitySeats} other places open</p></div><strong class="capacity-count">${s.learnerIds.length + s.communitySeats}<small>/${s.capacity}</small></strong><div class="schedule-actions">${s.cancelled ? '<span>Cancelled. History retained.</span>' : button('Edit class', 'edit-session', 'text-button', `data-id="${s.id}"`) + button('Cancel class', 'cancel-session', 'text-button', `data-id="${s.id}"`)}</div></article>`).join('')}</div>`).join('')}</section><aside class="scheduling-notes"><h2>Room to arrive</h2><p>A changeover buffer gives one group time to leave before the next group arrives.</p><div><strong>Capacity includes reserved places</strong><p>Community places count toward the room limit even before a learner is assigned.</p></div><div><strong>Availability is checked</strong><p>The planner checks each selected learner’s available day and time, including their other classes.</p></div><div><strong>Listen to the neighbours</strong><p>Record reported incidents in the impact register. A better timetable is a hypothesis to test.</p></div></aside></div>`;
}
function reflectionCards() {
  return state.reflections.slice().reverse().map(r => `<article class="reflection-entry"><div><span class="avatar ${levelClass(r.level)}">${esc(learnerName(r.learnerId)[0])}</span><div><h3>${esc(learnerName(r.learnerId))}</h3><p>${esc(r.skill)} · ${levels[r.level]}</p></div><small>${shortDate(r.createdAt.slice(0, 10))}</small></div><dl><dt>What I observed</dt><dd>${esc(r.evidence)}</dd><dt>Next teaching step</dt><dd>${esc(r.nextStep)}</dd><dt>My teaching reflection</dt><dd>${esc(r.teachingReflection)}</dd></dl><small>Teacher-observed engagement: ${r.engagement}/5. Contextual observation, not an attention diagnosis.</small></article>`).join('');
}
function reflectionLearnerSelect(session) {
  return select('learnerId', session?.learnerIds[0] || '', (session?.learnerIds || []).map(id => ({ value: id, label: learnerName(id) })), 'Learner');
}
function reflections() {
  const session = state.sessions[0];
  return `${header('Notice. Reflect. Adjust.', 'Turn a classroom observation into the next teaching decision.')}<div class="reflection-layout"><section class="reflection-form-sheet"><h2>A small, useful observation</h2><form data-form="reflection"><label class="field"><span>Class</span>${select('sessionId', session?.id || '', state.sessions.map(s => ({ value: s.id, label: `${s.title} · ${shortDate(s.date)}` })), 'Class', 'data-onchange="reflection-class"')}</label><label class="field"><span>Learner</span><div id="reflection-learners">${reflectionLearnerSelect(session)}</div></label><div class="form-grid"><label class="field"><span>Skill observed</span>${select('skill', 'Grammar', skills, 'Skill observed')}</label><label class="field"><span>Current evidence suggests</span>${select('level', '2', levels.slice(1).map((l, i) => ({ value: String(i + 1), label: l })), 'Current evidence suggests')}</label></div>${area('What did the learner do?', 'evidence', '', { max: 1000, hint: 'Describe a specific response or strategy. Use fictional information in this demo.' })}${area('What will you teach next?', 'nextStep', '', { max: 1000 })}${area('What will you change in your teaching?', 'teachingReflection', '', { max: 1000 })}<fieldset class="field"><legend>Observed engagement</legend><p class="muted">A contextual teacher observation, from 1 (needed frequent support) to 5 (sustained involvement).</p><div class="rating-group">${[1, 2, 3, 4, 5].map(n => `<label><input type="radio" name="engagement" value="${n}" ${n === 3 ? 'checked' : ''}><span>${n}</span></label>`).join('')}</div></fieldset><p class="form-error" role="alert" hidden></p><button class="button primary" type="submit">Save observation</button></form></section><section class="reflection-history"><h2>The teaching trail</h2>${state.reflections.length ? reflectionCards() : empty('The next step starts here', 'Your observations will appear here. Saving one updates that learner’s latest observation for the chosen skill.')}<div class="reflection-principle"><strong>Evidence over labels</strong><p>Record what the learner did, how you responded and what you will try next. Revisit a skill over time before drawing conclusions.</p></div></section></div>`;
}
function impactPage() {
  const totals = impact || { records: 0, sheetDifference: 0, minuteDifference: 0, placesUsed: 0, placesOffered: 0, incidents: 0 };
  return `${header('Make the evidence visible.', 'Environmental, social and governance measures, with their limits in view.', button('Record evidence', 'add-impact', 'button primary'))}<div class="impact-notice"><strong>${totals.records ? 'Teacher-entered demonstration evidence' : 'No impact results recorded yet'}</strong><p>Starting samples are excluded. These records do not establish educational effectiveness, funding eligibility or verified carbon savings.</p></div><section class="impact-numbers"><div><strong>${totals.records ? totals.sheetDifference : 'Not measured'}</strong><h2>Print-sheet difference</h2><p>Baseline sheets minus actual sheets. Negative values mean an increase.</p></div><div><strong>${totals.records ? `${totals.minuteDifference} min` : 'Not measured'}</strong><h2>Preparation-time difference</h2><p>Matched baseline minus actual preparation time, reported by the teacher.</p></div><div><strong>${totals.placesUsed}<small> / ${totals.placesOffered}</small></strong><h2>Community places used</h2><p>Used places alongside offered places. Availability alone is not access.</p></div><div><strong>${totals.records ? totals.incidents : 'Not measured'}</strong><h2>Neighbour incidents</h2><p>Reported incidents only. No evidence of improvement without a baseline.</p></div></section><div class="impact-columns"><section class="impact-register"><h2>The evidence register</h2>${state.impactLogs.length ? `<div class="evidence-list">${state.impactLogs.slice().reverse().map(l => `<article><div><strong>${shortDate(l.date)}</strong><span>${l.baselineSheets - l.actualSheets} sheets difference · ${l.placesUsed}/${l.placesOffered} community places used</span></div><p>${esc(l.note)}</p><small>Teacher-entered demo record · ${l.neighbourIncidents} reported incidents</small></article>`).join('')}</div>` : empty('A baseline comes first', 'Record a comparable paper-based lesson, then the same kind of lesson with Learning Room. Keep the source and measurement period.')}<h2>Governance in practice</h2><ul class="plain-list"><li>Separate demonstration workspaces with server-side access tokens.</li><li>Fictional aliases, minimal data and an export and delete path.</li><li>Teacher approval before a teaching note is marked ready.</li><li>Activity history and revision checks when two tabs save.</li></ul><div class="audit-list">${state.audit.slice(0, 5).map(a => `<p><strong>${esc(a.action)}</strong><span>${new Date(a.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Hong_Kong' })}</span></p>`).join('')}</div></section><aside class="impact-method"><h2>Count carefully.</h2><div><strong>Environmental</strong><p>Reuse notes and compare actual printing. Hosting and device energy have not been measured, so no carbon conversion is made.</p></div><div><strong>Social</strong><p>Offer supported places, shared-device access and printable activities. Track uptake and completion with a community partner.</p></div><div><strong>Governance</strong><p>Document consent, access, retention and review before a real learner pilot. This public demonstration is not a student-record system.</p></div><a class="text-link" href="#/plan">Pilot measures & funding routes</a></aside></div>`;
}
function collectLesson() {
  const form = $('[data-form="lesson"]'); const f = new FormData(form); const duration = +f.get('duration');
  return { topicId, title: f.get('title'), objective: f.get('objective'), instructions: f.get('instructions'), route, learnerIds: f.getAll('learnerIds'), duration, segments: (editingLesson?.segments || defaultSegments(duration)).map((s, i) => ({ title: s.title, minutes: +f.get(`segment-${i}`) })), teacherNotes: f.get('teacherNotes'), approved: f.has('approved') };
}
function captureDraft() { if ($('[data-form="lesson"]')) editingLesson = collectLesson(); }
function practice() {
  const t = topic(); const draft = editingLesson;
  return `${header('Give the lesson a try.', 'A learner preview. Answers stay in this tab and are not submitted as learner records.', button('Back to teaching note', 'back-studio', 'button secondary'))}<section class="practice-paper">${button('Print activity', 'print-note', 'button secondary print-note-button')}<div class="paper-meta"><span>${esc(route)} route</span><span>${esc(t.skill)} · ${t.grade}</span></div><h2>${esc(draft?.title || t.title)}</h2><p class="practice-objective">${esc(draft?.objective || t.objective)}</p><p>${esc(draft?.instructions || t[route.toLowerCase()])}</p>${t.transcript ? `<section class="practice-text"><h3>${t.skill === 'Listening' ? 'Listen to the message' : 'Read the text'}</h3>${t.skill === 'Listening' ? `${button('Play message', 'speak', 'button secondary')}<p class="muted">Device-generated speech. The transcript is always available.</p><details class="styled-details"><summary>Read the transcript</summary><p>${esc(t.transcript)}</p></details>` : `<p>${esc(t.transcript)}</p>`}</section>` : ''}<form data-form="practice">${t.questions.map((q, i) => `<fieldset class="practice-question"><legend>${i + 1}. ${esc(q.stem)}</legend><div class="answer-options">${q.options.map((o, n) => `<label><input type="radio" name="q-${i}" value="${n}" ${String(previewAnswers[i]) === String(n) ? 'checked' : ''} required><span>${esc(o)}</span></label>`).join('')}</div>${previewChecked ? `<div class="answer-feedback ${+previewAnswers[i] === q.answer ? 'correct' : 'retry'}"><strong>${+previewAnswers[i] === q.answer ? 'That works.' : 'Have another look.'}</strong><p>${esc(q.why)}</p></div>` : ''}</fieldset>`).join('')}${t.questions.length ? `<p class="form-error" role="alert" hidden></p><button class="button primary" type="submit">${previewChecked ? 'Check again' : 'Check core answers'}</button>${previewChecked ? `<p class="core-score" role="status">Core practice: ${t.questions.filter((q, i) => +previewAnswers[i] === q.answer).length} of ${t.questions.length} correct. Use the feedback, then try again.</p>` : ''}` : ''}<div class="writing-task"><h3>${t.questions.length ? 'Optional challenge' : 'Your writing'}</h3><p>${esc(t.questions.length ? t.challenge : t.core)}</p>${area('Your response', 'writing', previewAnswers.writing || '', { rows: 5, optional: true })}${area('Explain one choice you made', 'reasoning', previewAnswers.reasoning || '', { optional: true })}${button('Show review guidance', 'writing-guidance', 'button secondary')}<div id="writing-guidance" class="writing-guidance" hidden><strong>For teacher review. No automatic writing grade.</strong><ul>${t.rubric.map(r => `<li>${esc(r)}</li>`).join('')}</ul><p>${esc(t.exit)}</p></div></div></form></section>`;
}
function formError(form, error) { const el = $('.form-error', form); if (el) { el.hidden = false; el.textContent = error.message; el.scrollIntoView({ block: 'nearest' }); } else notify(error.message, true); }
function openModal(title, content, wide = false) {
  modalReturnFocus = document.activeElement;
  $('#modal-root').innerHTML = `<div class="modal-backdrop"><section class="modal ${wide ? 'modal-wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1" data-ui><div class="modal-heading"><h2 id="modal-title">${title}</h2>${button('Close', 'close-modal', 'text-button')}</div>${content}</section></div>`;
  document.body.classList.add('modal-open'); $('.modal').focus();
}
function closeModal() { $('#modal-root').innerHTML = ''; document.body.classList.remove('modal-open'); modalReturnFocus?.focus?.(); }
const timeOptions = () => Array.from({ length: 53 }, (_, i) => `${String(8 + Math.floor(i / 4)).padStart(2, '0')}:${String((i % 4) * 15).padStart(2, '0')}`);
function addLearner() {
  openModal('Make room for a learner', `<p class="muted">Fictional aliases only. Starting skill observations are blank until you record evidence.</p><form data-form="learner">${field('Learner alias', 'alias', '', { max: 40, placeholder: 'For example, Robin' })}${field('Fictional school', 'school', '', { required: false, optional: true, max: 100 })}<div class="form-grid"><label class="field"><span>School level</span>${select('grade', 'P5', ['P4', 'P5', 'P6'], 'School level')}</label><label class="field"><span>Learning access</span>${select('access', 'Centre tablet', ['Own device', 'Shared device', 'Centre tablet', 'Print preferred'], 'Learning access')}</label></div>${field('Current learning focus', 'focus', '', { required: false, optional: true, max: 180 })}<fieldset class="field"><legend>Available days</legend><div class="day-checks">${days.map(d => `<label><input type="checkbox" name="days" value="${d}" ${d === 'Saturday' ? 'checked' : ''}><span>${d.slice(0, 3)}</span></label>`).join('')}</div></fieldset><div class="form-grid"><label class="field"><span>Available from</span>${select('availableStart', '14:00', timeOptions(), 'Available from')}</label><label class="field"><span>Available until</span>${select('availableEnd', '19:00', timeOptions(), 'Available until')}</label></div><p class="form-error" role="alert" hidden></p><button type="submit" class="button primary">Save learner</button></form>`);
}
function sessionDialog(sessionId = '') {
  const s = state.sessions.find(s => s.id === sessionId);
  const formType = s ? 'session-update' : 'session';
  openModal(s ? 'Adjust this class' : 'Plan a calmer class', `<form data-form="${formType}">${s ? `<input type="hidden" name="id" value="${esc(s.id)}">` : ''}${field('Class name', 'title', s?.title || '', { max: 100 })}${field('Date in Hong Kong', 'date', s?.date || hkDate(), { hint: 'Use YYYY-MM-DD. All times are Hong Kong time.', placeholder: 'YYYY-MM-DD', inputmode: 'numeric', max: 10 })}<div class="form-grid"><label class="field"><span>Start</span>${select('start', s?.start || '16:00', timeOptions(), 'Start time')}</label><label class="field"><span>End</span>${select('end', s?.end || '17:00', timeOptions(), 'End time')}</label><label class="field"><span>Room</span>${select('room', s?.room || 'Room B', ['Room A', 'Room B'], 'Room')}</label><label class="field"><span>Teacher</span>${select('teacher', s?.teacher || 'Teacher A', ['Teacher A', 'Teacher B'], 'Teacher')}</label><label class="field"><span>Activity type</span>${select('noise', s?.noise || 'Conversation', ['Quiet', 'Conversation'], 'Activity type')}</label><label class="field"><span>Changeover buffer</span>${select('buffer', String(s?.buffer || 10), ['5', '10', '15', '20', '30'].map(n => ({ value: n, label: `${n} minutes` })), 'Changeover buffer')}</label>${field('Room capacity', 'capacity', s?.capacity || 6, { type: 'number', min: 1, maxN: 40 })}${field('Community places reserved', 'communitySeats', s?.communitySeats ?? 1, { type: 'number', min: 0, maxN: 40 })}</div><label class="field"><span>Teaching note</span>${select('lessonId', s?.lessonId || '', [{ value: '', label: 'Choose later' }, ...state.lessons.map(l => ({ value: l.id, label: l.title }))], 'Teaching note')}</label><fieldset class="field"><legend>Learners</legend>${learnerChecks(s?.learnerIds || [])}</fieldset><p class="form-hint">Capacity includes reserved places. The planner checks room, teacher and learner conflicts, availability and changeover time.</p><p class="form-error" role="alert" hidden></p><button type="submit" class="button primary">${s ? 'Save class changes' : 'Save class'}</button></form>`, true);
}
function printHandout() {
  if (view === 'studio') captureDraft();
  const t = topic(); const d = editingLesson;
  const el = document.createElement('section'); el.className = 'print-handout';
  el.innerHTML = `<p>Learning Room · Learner activity · ${esc(route)} route</p><h1>${esc(d?.title || t.title)}</h1><p><strong>Our learning goal:</strong> ${esc(d?.objective || t.objective)}</p><p>${esc(d?.instructions || t[route.toLowerCase()])}</p><div><h2>A model to think about</h2><p>${esc(t.model)}</p></div>${t.transcript ? `<div><h2>${t.skill === 'Listening' ? 'Listening transcript' : 'Reading text'}</h2><p>${esc(t.transcript)}</p></div>` : ''}${t.questions.map((q, i) => `<div class="print-question"><h2>${i + 1}. ${esc(q.stem)}</h2><p>${q.options.map(o => esc(o)).join(' / ')}</p><p>My choice: ____________________________________</p></div>`).join('')}<div class="print-question"><h2>${t.questions.length ? 'Optional challenge' : 'Your writing'}</h2><p>${esc(t.questions.length ? t.challenge : t.core)}</p><p class="print-writing-space">My response and reasoning:</p></div><h2>Before we finish</h2><p>${esc(t.exit)}</p><p class="print-writing-space">My next step:</p>`;
  document.body.appendChild(el); window.print(); el.remove();
}
function profile(id) {
  const l = state.learners.find(l => l.id === id); if (!l) return;
  const observations = state.reflections.filter(r => r.learnerId === id);
  openModal(`${esc(l.alias)}’s learning profile`, `<div class="profile-meta"><span>${l.grade}</span><span>${esc(l.school)}</span><span>${esc(l.access)}</span></div><p>${esc(l.focus || 'A learning focus has not been recorded yet.')}</p><h3>Latest skill observations</h3><div class="profile-skills">${skills.map(s => `<div><strong>${s}</strong><span class="route-label ${levelClass(l.skills[s])}">${levels[l.skills[s]]}</span></div>`).join('')}</div><h3>Available for class</h3><p>${l.availability.map(a => `${a.day} ${a.start} to ${a.end}`).join('<br>')}</p><h3>Evidence over time</h3>${observations.length ? observations.slice().reverse().map(o => `<div class="profile-observation"><strong>${esc(o.skill)} · ${levels[o.level]}</strong><p>${esc(o.evidence)}</p><p><strong>Next:</strong> ${esc(o.nextStep)}</p></div>`).join('') : '<p class="muted">No new observations recorded. The initial skill profile is fictional sample data.</p>'}<a class="button primary" href="#/reflections" data-close-modal>Record an observation</a>`);
}
function addImpact() {
  openModal('Record evidence, with context', `<p>Use a comparable teaching period. Enter zero where a measure does not apply and explain this in the source note.</p><form data-form="impact">${field('Measurement date', 'date', hkDate(), { max: 10, hint: 'YYYY-MM-DD', inputmode: 'numeric' })}<div class="form-grid">${[['Baseline print sheets', 'baselineSheets'], ['Actual print sheets', 'actualSheets'], ['Baseline preparation minutes', 'baselineMinutes'], ['Actual preparation minutes', 'actualMinutes'], ['Community places offered', 'placesOffered'], ['Community places used', 'placesUsed'], ['Reported neighbour incidents', 'neighbourIncidents']].map(([label, name]) => field(label, name, 0, { type: 'number', min: 0, maxN: 10000 })).join('')}</div>${area('Evidence source and measurement period', 'note', '', { max: 1000, hint: 'For example: two comparable P5 grammar classes; teacher timer and print log. Demonstration data only.' })}<p class="form-error" role="alert" hidden></p><button type="submit" class="button primary">Save evidence</button></form>`, true);
}
function about() {
  openModal('A working teaching pilot', `<p>This is a public Learning Room demonstration by KERN Design Studio. Learners, schools, observations and classes in the starting workspace are fictional.</p><ul class="plain-list"><li>Your workspace is separate from other visitors and saved on the teaching API.</li><li>This browser holds its access token. Anyone using the same browser profile may access the demo.</li><li>Workspaces expire seven days after creation or their latest save. They are not suitable for real student records.</li><li>Practice answers stay in this tab. Curated content makes no live AI calls.</li><li>Writing is reviewed by a teacher. Funding, endorsement and measured impact remain unconfirmed.</li></ul><div class="about-actions">${button('Export workspace', 'export', 'button secondary')}${button('Delete this workspace', 'confirm-delete', 'button danger')}</div><a class="text-link" href="#/plan" data-close-modal>Read the product and pilot plan</a>`);
}
async function renderRoute() {
  const next = location.hash.replace(/^#\/?/, '').split('?')[0] || 'home';
  if (lessonDirty && view === 'studio' && next !== 'studio' && next !== 'practice') captureDraft();
  if (view === 'practice') savePracticeDraft();
  if ($('#modal-root').innerHTML) closeModal();
  view = next;
  if (next === 'home' || next === 'impact-story') {
    $('#app').innerHTML = home(); document.title = 'Learning Room | Room for every learner'; addMotion();
    if (next === 'impact-story') requestAnimationFrame(() => $('#impact-story')?.scrollIntoView()); else scrollTo(0, 0); return;
  }
  if (next === 'plan') { $('#app').innerHTML = planPage(); document.title = 'Product and pilot plan | Learning Room'; scrollTo(0, 0); return; }
  $('#app').innerHTML = '<main id="main" class="loading"><h1>A little room to grow.</h1><p>Opening your separate demonstration workspace.</p></main>';
  try {
    await ensureWorkspace();
    if (!selectedLearners.size) selectedLearners = new Set(state.learners.slice(0, 4).map(l => l.id));
    const pages = { today, studio, learners, timetable, reflections, impact: impactPage, practice };
    if (!pages[next]) { location.hash = '/today'; return; }
    $('#app').innerHTML = shell(pages[next]()); document.title = `${labels[next] || 'Learner preview'} | Learning Room`; scrollTo(0, 0);
  } catch (error) {
    $('#app').innerHTML = `<main id="main" class="connection-error"><a href="#/">Learning Room.</a><h1>A moment to reconnect.</h1><p>${esc(error.message)}</p>${button('Try again', 'retry', 'button primary')}<a href="#/plan">Read the product plan</a></main>`;
  }
}
function addMotion() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const elements = $$('.hero h1,.hero>p,.hero>.button,.hero-note,.folder-strip,.folder-front,.story-copy>*,.story-image,.pilot-letter>*,.site-footer>*');
  const observer = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('entered'); observer.unobserve(e.target); } }), { threshold: 0.08 });
  elements.forEach((el, i) => { el.classList.add('will-enter'); el.style.setProperty('--stagger', `${Math.min(i % 5, 3) * 65}ms`); observer.observe(el); });
}
function closeSelect(component) { $('.select-options', component).hidden = true; $('.select-toggle', component).setAttribute('aria-expanded', 'false'); }
document.addEventListener('click', async e => {
  const option = e.target.closest('[data-option]');
  if (option) {
    const component = option.closest('[data-select]'); $('input', component).value = option.dataset.option;
    $('.select-toggle span', component).textContent = option.textContent;
    $$('[role="option"]', component).forEach(o => o.setAttribute('aria-selected', String(o === option)));
    closeSelect(component); $('.select-toggle', component).focus(); component.dispatchEvent(new Event('choice', { bubbles: true })); return;
  }
  const toggle = e.target.closest('.select-toggle');
  if (toggle) {
    const component = toggle.closest('[data-select]'); const open = toggle.getAttribute('aria-expanded') === 'true';
    $$('[data-select]').forEach(s => closeSelect(s));
    if (!open) { $('.select-options', component).hidden = false; toggle.setAttribute('aria-expanded', 'true'); $('[aria-selected="true"]', component)?.focus(); } return;
  }
  if (!e.target.closest('[data-select]')) $$('[data-select]').forEach(s => closeSelect(s));
  if (e.target.closest('[data-close-modal]')) closeModal();
  if (e.target.classList.contains('modal-backdrop')) closeModal();
  const actionEl = e.target.closest('[data-action]'); if (!actionEl || actionEl.disabled) return;
  const action = actionEl.dataset.action;
  if (action === 'close-modal') closeModal();
  if (action === 'retry') renderRoute();
  if (action === 'about') about();
  if (action === 'add-learner') addLearner();
  if (action === 'add-session') sessionDialog();
  if (action === 'add-impact') addImpact();
  if (action === 'print-note') printHandout();
  if (action === 'edit-session') sessionDialog(actionEl.dataset.id);
  if (action === 'cancel-session') openModal('Cancel this class?', `<p>The class is removed from conflict checks and retained in the timetable as cancelled. Its observations remain available.</p><div class="about-actions">${button('Keep class', 'close-modal', 'button secondary')}${button('Cancel class', 'confirm-cancel-session', 'button danger', `data-id="${esc(actionEl.dataset.id)}"`)}</div>`);
  if (action === 'confirm-cancel-session') {
    actionEl.disabled = true;
    try { await mutate('session-cancel', { id: actionEl.dataset.id }); closeModal(); await renderRoute(); notify('Class cancelled. Its history is retained.'); }
    catch (error) { actionEl.disabled = false; notify(error.message, true); }
  }
  if (action === 'profile') profile(actionEl.dataset.id);
  if (action === 'route') {
    captureDraft(); route = actionEl.dataset.route; editingLesson.route = route; editingLesson.instructions = topic()[route.toLowerCase()];
    $('#app').innerHTML = shell(studio()); lessonDirty = true;
  }
  if (action === 'open-lesson') {
    const l = state.lessons.find(l => l.id === actionEl.dataset.id); if (!l) return;
    editingLesson = structuredClone(l); topicId = l.topicId; route = l.route; selectedLearners = new Set(l.learnerIds); lessonDirty = false;
    if (view === 'studio') $('#app').innerHTML = shell(studio()); else location.hash = '/studio';
  }
  if (action === 'preview') { captureDraft(); previewAnswers = {}; previewChecked = false; location.hash = '/practice'; }
  if (action === 'back-studio') { savePracticeDraft(); location.hash = '/studio'; }
  if (action === 'writing-guidance') {
    const form = $('[data-form="practice"]'); const writing = $('[name="writing"]', form); const reasoning = $('[name="reasoning"]', form);
    if (!writing.value.trim() || !reasoning.value.trim()) { notify('Write a response and explain one choice before opening the review guidance.', true); (!writing.value.trim() ? writing : reasoning).focus(); return; }
    $('#writing-guidance').hidden = false; $('#writing-guidance').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  if (action === 'speak') {
    if (!('speechSynthesis' in window)) { notify('Device speech is unavailable. Use the transcript instead.', true); return; }
    speechSynthesis.cancel(); const message = new SpeechSynthesisUtterance(topic().transcript); message.lang = 'en-GB'; message.rate = 0.85;
    message.onerror = () => notify('Speech could not play on this device. Use the transcript instead.', true); speechSynthesis.speak(message);
  }
  if (action === 'export') {
    actionEl.disabled = true;
    try { const body = await request('/api/export'); download(JSON.stringify(body, null, 2), 'learning-room-demo.json', 'application/json'); notify('Demonstration workspace exported. The access token is excluded.'); }
    catch (error) { notify(error.message, true); } finally { actionEl.disabled = false; }
  }
  if (action === 'confirm-delete') openModal('Delete this demonstration?', `<p>This deletes the current workspace from the teaching server, including saved notes, learners and observations. You can open a fresh sample afterwards.</p><div class="about-actions">${button('Keep workspace', 'close-modal', 'button secondary')}${button('Delete workspace', 'delete-workspace', 'button danger')}</div>`);
  if (action === 'delete-workspace') {
    actionEl.disabled = true;
    try { await request('/api/workspace', 'DELETE'); try { localStorage.removeItem(STORAGE); } catch {} token = null; state = null; revision = 0; selectedLearners.clear(); editingLesson = null; lessonDirty = false; closeModal(); location.hash = '/'; notify('Demonstration workspace deleted.'); }
    catch (error) { actionEl.disabled = false; notify(error.message, true); }
  }
});
document.addEventListener('choice', e => {
  const component = e.target.closest('[data-select]'); const kind = component?.dataset.onchange; const value = $('input', component).value;
  if (kind === 'topic') { captureDraft(); topicId = value; editingLesson = null; route = 'Core'; lessonDirty = true; $('#app').innerHTML = shell(studio()); }
  if (kind === 'duration') { captureDraft(); editingLesson.duration = +value; editingLesson.segments = defaultSegments(+value); lessonDirty = true; $('#app').innerHTML = shell(studio()); }
  if (kind === 'school') { schoolFilter = value; $('#learner-results').innerHTML = learnerRows(); }
  if (kind === 'reflection-class') { const s = state.sessions.find(s => s.id === value); $('#reflection-learners').innerHTML = reflectionLearnerSelect(s); }
});
document.addEventListener('keydown', e => {
  const selectEl = e.target.closest('[data-select]');
  if (selectEl && ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Escape', 'Enter', ' '].includes(e.key)) {
    const toggle = $('.select-toggle', selectEl); const menu = $('.select-options', selectEl); const options = $$('[data-option]', selectEl); let index = options.indexOf(document.activeElement);
    if (e.key === 'Escape') { e.preventDefault(); closeSelect(selectEl); toggle.focus(); return; }
    if ((e.key === 'Enter' || e.key === ' ') && e.target === toggle) return;
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
      e.preventDefault(); menu.hidden = false; toggle.setAttribute('aria-expanded', 'true');
      index = e.key === 'Home' ? 0 : e.key === 'End' ? options.length - 1 : (index + (e.key === 'ArrowUp' ? -1 : 1) + options.length) % options.length;
      options[index]?.focus(); return;
    }
  }
  const modal = $('.modal');
  if (modal) {
    if (e.key === 'Escape') { e.preventDefault(); closeModal(); }
    if (e.key === 'Tab') {
      const all = $$('button:not([disabled]),a[href],input:not([type="hidden"]),textarea,[tabindex="0"]', modal).filter(el => !el.closest('[hidden]'));
      const first = all[0], last = all.at(-1);
      if (e.shiftKey && (document.activeElement === first || document.activeElement === modal)) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || document.activeElement === modal)) { e.preventDefault(); first?.focus(); }
    }
  }
});
document.addEventListener('input', e => {
  if (e.target.id === 'learner-search') { learnersQuery = e.target.value; $('#learner-results').innerHTML = learnerRows(); }
  if (e.target.closest('[data-form="lesson"]')) {
    lessonDirty = true;
    if (e.target.name?.startsWith('segment-')) {
      const form = e.target.form; const total = $$('[name^="segment-"]', form).reduce((n, el) => n + +el.value, 0); const duration = +$('[name="duration"]', form).value;
      const el = $('.segment-total', form); el.textContent = `${total} of ${duration} minutes planned`; el.classList.toggle('invalid-total', total !== duration);
    }
  }
});
document.addEventListener('change', e => {
  if (e.target.name === 'learnerIds' && e.target.closest('[data-form="lesson"]')) {
    selectedLearners = new Set(new FormData(e.target.form).getAll('learnerIds'));
    const t = topic(); $('.route-counts').innerHTML = routes.map(r => `<span>${r} <b>${state.learners.filter(l => selectedLearners.has(l.id) && routeFor(l.skills[t.skill]) === r).length}</b></span>`).join('');
  }
});
function savePracticeDraft() {
  const form = $('[data-form="practice"]'); if (!form) return;
  const f = new FormData(form); topic().questions.forEach((q, i) => { if (f.has(`q-${i}`)) previewAnswers[i] = f.get(`q-${i}`); });
  previewAnswers.writing = f.get('writing'); previewAnswers.reasoning = f.get('reasoning');
}
document.addEventListener('submit', async e => {
  const form = e.target.closest('[data-form]'); if (!form) return; e.preventDefault();
  if (form.dataset.form === 'practice') {
    savePracticeDraft();
    if (topic().questions.some((q, i) => previewAnswers[i] === undefined)) { formError(form, new Error('Choose an answer for each core question.')); return; }
    previewChecked = true; const y = scrollY; $('#app').innerHTML = shell(practice()); scrollTo(0, y); return;
  }
  if (busy) return; busy = true;
  const submit = $('button[type="submit"]', form); submit.disabled = true; const oldText = submit.textContent; submit.textContent = 'Saving…';
  const f = new FormData(form); const type = form.dataset.form; let data = Object.fromEntries(f);
  try {
    if (type === 'lesson') data = collectLesson();
    if (type === 'learner') data.availability = f.getAll('days').map(day => ({ day, start: f.get('availableStart'), end: f.get('availableEnd') }));
    if (type === 'session' || type === 'session-update') { data.learnerIds = f.getAll('learnerIds'); for (const key of ['capacity', 'communitySeats', 'buffer']) data[key] = +data[key]; }
    if (type === 'reflection') { data.level = +data.level; data.engagement = +data.engagement; }
    if (type === 'impact') for (const key of ['baselineSheets', 'actualSheets', 'baselineMinutes', 'actualMinutes', 'placesOffered', 'placesUsed', 'neighbourIncidents']) data[key] = +data[key];
    const record = await mutate(type, data);
    if (type === 'lesson') { editingLesson = structuredClone(record); lessonDirty = false; selectedLearners = new Set(record.learnerIds); $('#app').innerHTML = shell(studio()); notify('Teaching note saved as a new version.'); }
    else { closeModal(); await renderRoute(); notify({ learner: 'Learner added. Skill observations start blank.', session: 'Class saved. Availability, changeover and capacity checks passed.', 'session-update': 'Class updated. All scheduling checks passed.', reflection: 'Observation saved. The learner’s skill profile is updated.', impact: 'Evidence saved with its source note.' }[type]); }
  } catch (error) { formError(form, error); }
  finally { busy = false; if (submit.isConnected) { submit.disabled = false; submit.textContent = oldText; } }
});
function download(content, filename, type) { const url = URL.createObjectURL(new Blob([content], { type })); const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 5000); }
window.addEventListener('beforeunload', e => { if (lessonDirty) { e.preventDefault(); e.returnValue = ''; } });
window.addEventListener('hashchange', renderRoute);
renderRoute();
