import { STORAGE_KEY, WEIGHTS, defaultState, restoreState, profileValidation, completion, PROFILE_LABELS, match, ranked, newApplication, deadline, applicationStage, guidance } from './js/demo.js';

// One mutable state, one persistence boundary. All screens read this state.
let state;
let storageAvailable = true;
let startupNotice = '';
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try { state = restoreState(JSON.parse(saved)); }
    catch { state = defaultState(); startupNotice = 'Saved demo data was invalid or incompatible. Sara’s original demo has been restored.'; }
  } else state = defaultState();
} catch {
  state = defaultState(); storageAvailable = false;
  startupNotice = 'Browser storage is unavailable. You can explore, but changes will last only in this open page.';
}
const screens = new Map(Array.from(document.querySelectorAll('[data-screen]'), screen => [screen.dataset.screen, screen]));
const form = document.getElementById('profile-demo');
const previewDialog = document.getElementById('preview-dialog');
const resetDialog = document.getElementById('reset-dialog');
let dialogTrigger = null;
let resetTrigger = null;
let currentRoute = '';
let selectedApplication = state.applications[0]?.id || null;

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
function link(text, hash, className = '') {
  const element = node('a', className, text); element.href = hash; return element;
}
function list(items, className = '') {
  const element = node('ul', className); items.forEach(text => element.append(node('li', '', text))); return element;
}
function facts(values, className = 'opportunity-facts') {
  const dl = node('dl', className);
  values.forEach(([label, value]) => { const row = node('div'); row.append(node('dt', '', label), node('dd', '', value)); dl.append(row); });
  return dl;
}
function announce(message) { document.getElementById('app-status').textContent = message; }
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); storageAvailable = true; }
  catch { storageAvailable = false; }
  document.getElementById('storage-note').textContent = storageAvailable
    ? 'Demo data is stored only in this browser. Use fictional information.'
    : 'Browser storage is unavailable. Changes last only in this open page; they cannot survive refresh.';
  return storageAvailable;
}
function opportunityById(id) { return state.opportunities.find(item => item.id === id); }
function applicationById(id) { return state.applications.find(item => item.id === id); }
function selectedCase() { return applicationById(selectedApplication) || state.applications[0]; }
function opportunityRoute(id) { return `#opportunity?id=${encodeURIComponent(id)}`; }
function applicationRoute(id) { return `#applications?id=${encodeURIComponent(id)}`; }
function fundingLabel(opportunity) { return opportunity.fundingType === 'full' ? 'Full-funding scenario' : 'Partial-funding scenario'; }
function deadlineLabel(opportunity) {
  const date = deadline(state, opportunity);
  const days = Math.ceil((date.getTime() - Date.now()) / 86400000);
  return days >= 0 ? `${days} days remaining` : 'Scenario deadline passed';
}
function deadlineDate(opportunity) { return deadline(state, opportunity).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
function ring(score) {
  const element = node('div', 'score-ring', `${score}%`);
  element.style.setProperty('--score', `${score}%`);
  element.setAttribute('aria-label', `Profile Match: ${score} percent compatibility, not admission probability.`);
  return element;
}
function statusBadge(result) { return node('span', result.status === 'Likely eligible' ? 'badge cyan' : 'badge gold', result.status); }
function opportunityCard(opportunity, result, compact) {
  const card = node('article', compact ? 'card opportunity-card' : 'match-card');
  card.dataset.opportunityId = opportunity.id;
  card.dataset.score = result.score;
  const content = node('div', 'opportunity-content');
  content.append(node('span', 'badge cyan', 'Profile Match'), node('h3', '', opportunity.title), node('p', 'university-label', `${opportunity.institutionLabel} · ${opportunity.type}`));
  content.append(statusBadge(result));
  const metadata = facts([['Funding', fundingLabel(opportunity)], ['Deadline', deadlineLabel(opportunity)]]);
  if (compact) content.append(metadata);
  content.append(node('p', 'reason-label', 'Why it matches'));
  const reasons = list(result.strengths.slice(0, 3), 'match-reasons');
  reasons.querySelectorAll('li').forEach(item => item.className = 'reason');
  content.append(reasons);
  if (result.gaps.length) content.append(node('p', 'match-gap', `Consider: ${result.gaps[0]}`));
  const action = link('View Opportunity', opportunityRoute(opportunity.id), 'soft');
  action.setAttribute('aria-label', `View ${opportunity.title}`);
  if (compact) card.append(ring(result.score), content, action);
  else { const aside = node('div', 'opportunity-action'); aside.append(metadata, action); card.append(ring(result.score), content, aside); }
  return card;
}
function renderOpportunities() {
  const matches = ranked(state);
  document.querySelectorAll('[data-opportunity-list]').forEach(container => {
    const compact = container.dataset.opportunityList !== 'workspace';
    const shown = compact ? matches.slice(0, 3) : matches;
    container.replaceChildren(...shown.map(({ opportunity, result }) => opportunityCard(opportunity, result, compact)));
  });
  document.getElementById('matching-context').replaceChildren(...facts([
    ['Student', state.profile.fullName], ['Nationality', state.profile.nationality], ['Target', state.profile.degree], ['Field', state.profile.major],
    ['GPA', state.profile.gpa === null ? 'Not provided' : `${state.profile.gpa} / ${state.profile.gpaScale}`],
    ['TOPIK', state.profile.topik ? `Level ${state.profile.topik}` : 'Not provided'], ['IELTS', state.profile.ielts ?? 'Not provided'], ['Interest', state.profile.interests || 'Not provided'],
    ['Location', state.profile.location],
  ], 'profile-context').children);
}
function fillProfile() {
  Object.entries(state.profile).forEach(([key, value]) => { if (form.elements[key]) form.elements[key].value = value === null ? '' : String(value); });
  form.elements.gpa.max = state.profile.gpaScale;
}
function clearErrors() {
  form.querySelectorAll('[aria-invalid]').forEach(input => input.removeAttribute('aria-invalid'));
  form.querySelectorAll('.field-error').forEach(item => item.remove());
  form.querySelectorAll('[aria-describedby]').forEach(input => input.removeAttribute('aria-describedby'));
  document.getElementById('profile-errors').hidden = true;
}
function renderProfile() {
  const progress = completion(state.profile);
  document.getElementById('profile-summary').textContent = `${state.profile.fullName} · ${state.profile.major} · ${state.profile.degree} in Korea`;
  document.getElementById('profile-percent').textContent = `${progress.percent}%`;
  const indicator = document.getElementById('sample-progress'); indicator.value = progress.percent; indicator.textContent = `${progress.percent}%`;
  const next = document.getElementById('profile-next');
  next.replaceChildren(node('strong', '', progress.missing.length ? 'Next focus' : 'Profile ready to explore'));
  next.append(document.createTextNode(progress.missing.length ? `Add ${progress.missing.map(key => PROFILE_LABELS[key]).join(', ')} to complete your matching context.` : 'Explore your matches and check the requirements before choosing a preparation case.'));
  const docs = document.getElementById('profile-documents');
  const app = selectedCase();
  docs.replaceChildren();
  if (!app) docs.append(node('li', '', 'Start an application to create its preparation checklist.'));
  else {
    app.documents.forEach(doc => { const row = node('li'); row.append(node('span', '', doc.title), node('span', doc.ready ? 'badge cyan' : 'badge gold', doc.ready ? 'Ready' : 'To prepare')); docs.append(row); });
    const source = node('li'); source.append(link(`Open ${opportunityById(app.opportunityId).title} checklist`, applicationRoute(app.id))); docs.append(source);
  }
}
function tracker(application) {
  const current = applicationStage(application, state.tasks);
  const ol = node('ol', 'track');
  for (const title of ['Profile', 'Match', 'Documents', 'Review', 'Submission', 'Result']) {
    const done = title === 'Profile' || title === 'Match' || (title === 'Documents' && current === 'Review');
    const item = node('li', done ? 'done' : title === current ? 'now' : '');
    const label = title === 'Profile' ? 'Complete' : title === 'Match' ? 'Selected' : title === current ? (title === 'Review' ? 'Ready for review' : 'In progress') : done ? 'Prepared' : ['Submission', 'Result'].includes(title) ? 'Unavailable' : 'Not started';
    item.append(node('strong', '', title), node('span', '', label));
    if (title === current) item.setAttribute('aria-current', 'step');
    ol.append(item);
  }
  return ol;
}
function nextTask(application) { return state.tasks.find(task => task.applicationId === application.id && !task.complete); }
function taskDestination(task) { return task.key === 'requirements' ? opportunityRoute(applicationById(task.applicationId).opportunityId) : task.key === 'mentor' ? '#mentor' : applicationRoute(task.applicationId); }
function documentRows(application, interactive) {
  const ul = node('ul', 'document-list');
  application.documents.forEach(doc => {
    const item = node('li');
    if (interactive) {
      const label = node('label', 'check-control');
      const input = node('input'); input.type = 'checkbox'; input.checked = doc.ready;
      input.id = `${application.id}-${doc.id}`; input.dataset.document = doc.id; input.dataset.application = application.id;
      label.append(input, node('span', '', doc.title)); item.append(label);
    } else item.append(node('span', '', doc.title));
    item.append(node('span', doc.ready ? 'badge cyan' : 'badge gold', doc.ready ? 'Ready' : 'To prepare'));
    ul.append(item);
  });
  return ul;
}
function taskRows(application) {
  const ul = node('ul', 'task-checklist');
  state.tasks.filter(task => task.applicationId === application.id).forEach(task => {
    const row = node('li', task.complete ? 'task-complete' : '');
    const label = node('label', 'check-control');
    const input = node('input'); input.type = 'checkbox'; input.checked = task.complete; input.id = task.id; input.dataset.task = task.id;
    label.append(input, node('span', '', task.title));
    row.append(label, node('p', 'small', task.description), link(task.key === 'mentor' ? 'Read mentor guidance' : task.key === 'requirements' ? 'View requirements' : 'View preparation case', taskDestination(task)));
    ul.append(row);
  });
  return ul;
}
function caseOverview(application, compact = false) {
  const opportunity = opportunityById(application.opportunityId);
  const stage = applicationStage(application, state.tasks);
  const panel = node('section', 'panel case-overview');
  const header = node('div', 'heading-row');
  const title = node('div'); title.append(node('span', 'badge gold', stage === 'Review' ? 'Ready for review' : 'Preparing documents'), node(compact ? 'h3' : 'h2', '', opportunity.title));
  title.append(node('p', 'small', `Case ${application.id} · Linked profile: ${application.profileSnapshot.fullName}`));
  header.append(title, compact ? link('Explore the tracker', applicationRoute(application.id), 'ghost') : node('span', 'badge', `${deadlineLabel(opportunity)} · scenario`));
  panel.append(header, tracker(application));
  if (compact) {
    const ready = application.documents.filter(doc => doc.ready).length;
    const details = node('div', 'preview-details');
    const action = nextTask(application)?.title || (stage === 'Review' ? 'Review your preparation' : 'Prepare remaining documents');
    [['Documents', `${ready} of 4 ready`], ['Next action', action], ['Preparation deadline', deadlineLabel(opportunity)], ['Mentor feedback', guidance(state, application)]].forEach(([label, value]) => { const text = node('p'); text.append(node('strong', '', label), node('span', '', value)); details.append(text); });
    panel.append(details);
  } else {
    panel.append(node('p', 'small', `Profile Match: ${match(state.profile, opportunity).score}% current · ${application.matchAtCreation}% when started. Checklist preparation only; no submission.`));
    const action = node('div', 'case-next'); const copy = node('div');
    copy.append(node('span', 'eyebrow', 'Next action'), node('h3', '', nextTask(application)?.title || (stage === 'Review' ? 'Review your preparation.' : 'Prepare remaining documents.')), node('p', '', 'Use the checklist below to track preparation. Review is a planning stage; submission and results are unavailable.'));
    action.append(copy, link('Read mentor guidance', '#mentor', 'primary')); panel.append(action);
  }
  return panel;
}
function renderHomeTracker() {
  const app = selectedCase();
  document.getElementById('home-case-preview').replaceChildren(app ? caseOverview(app, true) : emptyCases());
}
function emptyCases() {
  const panel = node('div', 'panel empty-state');
  panel.append(node('h2', '', 'Your next chapter starts with a match.'), node('p', '', 'Choose a synthetic opportunity to create your first preparation case.'), link('Explore Opportunities', '#opportunities', 'primary'));
  return panel;
}
function renderApplications() {
  const container = document.getElementById('applications-state'); container.replaceChildren();
  if (!state.applications.length) { container.append(emptyCases()); return; }
  const selection = node('nav', 'application-selector'); selection.setAttribute('aria-label', 'Select application');
  const app = selectedCase();
  state.applications.forEach(item => {
    const anchor = link(opportunityById(item.opportunityId).title, applicationRoute(item.id), 'case-tab');
    if (item.id === app.id) anchor.setAttribute('aria-current', 'page');
    selection.append(anchor);
  });
  const ready = app.documents.filter(doc => doc.ready).length;
  const documents = node('section', 'panel');
  documents.append(node('h2', '', 'Document checklist'), node('p', '', `${ready} of 4 ready · checklist metadata only.`));
  const label = node('label', 'small', 'Document readiness'); label.htmlFor = 'document-readiness';
  const progress = node('progress'); progress.id = 'document-readiness'; progress.max = 4; progress.value = ready; progress.textContent = `${ready} of 4`;
  documents.append(label, progress, documentRows(app, true), node('p', 'small', 'No files are uploaded or stored in this demo. Check only fictional preparation status.'));
  const tasks = node('section', 'panel'); tasks.append(node('h2', '', 'Tasks & next actions'), taskRows(app));
  const grid = node('div', 'grid cols2 workspace-section'); grid.append(documents, tasks);
  const mentor = node('section', 'panel mentor-guidance workspace-section');
  mentor.append(node('span', 'badge cyan', `${state.guidance.name} · fictional mentor`), node('h2', '', 'Guidance for your next step'), node('blockquote', '', guidance(state, app)), link('Open My Mentor', '#mentor', 'ghost'));
  container.append(selection, caseOverview(app), grid, mentor);
}
function renderDetail(id) {
  const opportunity = opportunityById(id); if (!opportunity) return;
  const result = match(state.profile, opportunity);
  document.getElementById('opportunity-title').textContent = opportunity.title;
  document.getElementById('opportunity-description').textContent = `${opportunity.description} No verified scholarship or university integration is represented.`;
  const summary = node('section', 'panel detail-summary');
  const context = node('div'); context.append(node('h2', '', 'Your profile fit'), statusBadge(result), node('p', 'small', 'Compatibility and synthetic eligibility checks, not probability of admission or funding.'));
  summary.append(ring(result.score), context, facts([['Funding', fundingLabel(opportunity)], ['Location', opportunity.location], ['Scenario deadline', `${deadlineDate(opportunity)} · ${deadlineLabel(opportunity)}`]]));
  const explanations = node('div', 'grid cols2 workspace-section');
  const strengths = node('section', 'panel'); strengths.append(node('h2', '', 'Why it matches'), list(result.strengths.length ? result.strengths : ['No strong alignment yet. Review the requirements and your saved profile.']));
  const gaps = node('section', 'panel'); gaps.append(node('h2', '', 'Gaps & considerations'), list(result.gaps.length ? result.gaps : ['No gaps identified against these synthetic requirements. This is not an admission guarantee.']));
  explanations.append(strengths, gaps);
  const weights = node('section', 'panel workspace-section'); weights.append(node('h2', '', 'How this match is calculated'), node('p', 'small', 'Deterministic rules, not a real AI model. Each dimension contributes to a whole-number compatibility score.'));
  const labels = { academic: 'Academic fit', language: 'Language fit', field: 'Field / research fit', funding: 'Funding fit', location: 'Location fit' };
  weights.append(facts(Object.entries(WEIGHTS).map(([key, weight]) => [labels[key], `${result.breakdown[key]} / ${weight} points`]), 'profile-context'));
  const preparation = node('div', 'grid cols2 workspace-section');
  const requirements = node('section', 'panel'); requirements.append(node('h2', '', 'Synthetic requirements'), list(opportunity.requirements));
  const steps = node('section', 'panel'); steps.append(node('h2', '', 'Recommended preparation'), list(opportunity.nextSteps)); preparation.append(requirements, steps);
  const application = state.applications.find(item => item.opportunityId === id);
  const journey = node('section', 'panel workspace-section');
  journey.append(node('h2', '', 'Your preparation journey'), node('p', '', 'Profile → Match → Documents → Review → Submission → Result. Only preparation and review planning are interactive; submission and results are unavailable.'));
  if (application) context.append(link('View Application', applicationRoute(application.id), 'primary'));
  else { const start = node('button', 'primary', 'Start Application'); start.type = 'button'; start.dataset.startApplication = id; context.append(start); }
  document.getElementById('opportunity-state').replaceChildren(summary, explanations, weights, preparation, journey);
}
function renderDashboard() {
  const progress = completion(state.profile);
  document.getElementById('dashboard-welcome').textContent = `Welcome, ${state.profile.fullName}. Here is what to focus on in your Korea journey.`;
  const tasks = state.tasks.filter(task => !task.complete);
  const needsDocs = state.applications.find(app => app.documents.some(doc => !doc.ready));
  const next = progress.percent < 100 ? { title: 'Complete your profile.', body: `Add ${progress.missing.map(key => PROFILE_LABELS[key]).join(', ')} for a fuller matching context.`, text: 'Complete My Profile', href: '#profile' }
    : !state.applications.length ? { title: 'Explore your best matches.', body: 'Read the synthetic requirements and choose a pathway to prepare.', text: 'Explore Opportunities', href: '#opportunities' }
    : tasks.length ? { title: tasks[0].title, body: tasks[0].description, text: 'View next action', href: taskDestination(tasks[0]) }
    : needsDocs ? { title: 'Prepare remaining documents.', body: 'Check the preparation statuses for your application.', text: 'View document checklist', href: applicationRoute(needsDocs.id) }
    : { title: 'Review your preparation.', body: 'Your checklists are ready. No submission or university connection is available.', text: 'Review My Applications', href: '#applications' };
  const action = node('div', 'next-action panel'); const copy = node('div');
  copy.append(node('span', 'eyebrow', 'Your next action'), node('h2', '', next.title), node('p', '', next.body)); action.append(copy, link(next.text, next.href, 'primary'));
  const stats = node('div', 'dashboard-stats');
  const journey = node('section', 'journey-status'); journey.append(node('h2', '', `Your journey · Profile ${progress.percent}% complete`));
  const active = progress.percent < 100 ? 'Profile' : state.applications.length ? 'Track' : 'Match';
  const ol = node('ol', 'workspace-journey');
  ['Profile', 'Match', 'Apply', 'Track', 'Arrive', 'Live'].forEach((title, index) => {
    const currentIndex = ['Profile', 'Match', 'Apply', 'Track'].indexOf(active);
    const item = node('li', title === active ? 'current' : index < currentIndex ? 'complete' : '', title);
    if (title === active) item.setAttribute('aria-current', 'step');
    if (index > 3) item.setAttribute('aria-label', `${title}: future`);
    ol.append(item);
  }); journey.append(ol);
  const deadlines = state.applications.map(app => opportunityById(app.opportunityId)).sort((a, b) => deadline(state, a) - deadline(state, b));
  const due = node('section', 'quiet-stat'); due.append(node('h2', '', 'Nearest scenario deadline'), node('strong', '', deadlines.length ? deadlineLabel(deadlines[0]) : 'No active cases'), node('p', '', deadlines.length ? deadlineDate(deadlines[0]) : 'Choose a pathway to see its preparation window'));
  const count = node('section', 'quiet-stat'); count.append(node('h2', '', 'Applications'), node('strong', '', `${state.applications.length} active ${state.applications.length === 1 ? 'case' : 'cases'}`), node('p', '', `${tasks.length} tasks remaining · no submission`)); stats.append(journey, due, count);
  const priorities = node('section', 'panel'); priorities.append(node('h2', '', 'Priority actions'));
  const taskList = node('ol', 'priority-list');
  if (progress.missing.length) { const row = node('li'); row.append(node('strong', '', 'Complete your matching context'), link('Review profile', '#profile')); taskList.append(row); }
  tasks.slice(0, 3).forEach(task => { const row = node('li'); row.append(node('strong', '', task.title), node('p', '', opportunityById(applicationById(task.applicationId).opportunityId).title), link('View next action', taskDestination(task))); taskList.append(row); });
  if (!tasks.length) { const row = node('li'); row.append(node('p', '', state.applications.length ? 'Preparation tasks complete. Check document readiness and review your case.' : 'No preparation tasks yet. Explore your matches to begin.'), link(state.applications.length ? 'Review applications' : 'Explore Opportunities', state.applications.length ? '#applications' : '#opportunities')); taskList.append(row); }
  priorities.append(taskList);
  const mentor = node('section', 'panel mentor-guidance'); mentor.append(node('span', 'badge cyan', `${state.guidance.name} · fictional mentor`), node('h2', '', 'You do not have to plan alone.'), node('blockquote', '', guidance(state)), link('Read mentor guidance', '#mentor', 'ghost'));
  const grid = node('div', 'grid cols2'); grid.append(priorities, mentor);
  document.getElementById('dashboard-state').replaceChildren(action, stats, grid);
}
function renderAll() {
  renderOpportunities(); renderProfile(); renderDashboard(); renderApplications(); renderHomeTracker();
  document.getElementById('mentor-feedback').textContent = guidance(state, selectedCase());
  const route = parseRoute(); if (route.name === 'opportunity') renderDetail(route.id);
}
function parseRoute() {
  const hash = location.hash.slice(1);
  const [name, query = ''] = hash.split('?');
  const params = new URLSearchParams(query);
  const id = params.get('id');
  if (!name) return { name: 'home', valid: true };
  if (!screens.has(name) || (name === 'opportunity' && !opportunityById(id))) return { name: 'home', valid: false };
  if (name === 'applications' && id && !applicationById(id)) return { name: 'home', valid: false };
  if ((name !== 'opportunity' && name !== 'applications' && query) || [...params.keys()].some(key => key !== 'id') || params.getAll('id').length > 1) return { name: 'home', valid: false };
  return { name, id, valid: true };
}
function route() {
  const requested = parseRoute();
  if (!requested.valid || !location.hash) history.replaceState(null, '', `${location.pathname}${location.search}#home`);
  const key = requested.name + (requested.id ? `:${requested.id}` : '');
  if (key === currentRoute) return;
  if (previewDialog.open) previewDialog.close();
  if (resetDialog.open) resetDialog.close();
  if (requested.name === 'applications' && requested.id) selectedApplication = requested.id;
  renderAll();
  screens.forEach((screen, name) => { screen.hidden = name !== requested.name; screen.classList.toggle('active', name === requested.name); });
  document.body.classList.toggle('is-workspace', requested.name !== 'home');
  const navName = requested.name === 'opportunity' ? 'opportunities' : requested.name;
  document.querySelectorAll('.workspace-nav a, .public-nav a, .workspace-home, .brand').forEach(anchor => {
    const active = anchor.getAttribute('href') === `#${navName}`; anchor.classList.toggle('active', active);
    if (active) anchor.setAttribute('aria-current', 'page'); else anchor.removeAttribute('aria-current');
  });
  const heading = screens.get(requested.name).querySelector('h1');
  document.title = `${heading.textContent.trim()} | My_Hanguel`;
  heading.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'instant' }); currentRoute = key;
}
window.addEventListener('hashchange', route);
window.addEventListener('popstate', route);
document.querySelector('.skip-link').addEventListener('click', event => { event.preventDefault(); const main = document.getElementById('main-content'); main.focus(); main.scrollIntoView(); });
form.addEventListener('change', event => { if (event.target.name === 'gpaScale') form.elements.gpa.max = event.target.value; });
form.addEventListener('submit', event => {
  event.preventDefault(); clearErrors();
  clearTimeout(profileStatusTimer);
  profileStatus.textContent = '';
  const { profile, errors } = profileValidation(Object.fromEntries(new FormData(form)));
  if (Object.keys(errors).length) {
    for (const [key, text] of Object.entries(errors)) {
      const input = form.elements[key]; const message = node('span', 'field-error', text); message.id = `${key}-error`;
      input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', message.id); input.closest('label').append(message);
    }
    const summary = document.getElementById('profile-errors'); summary.textContent = 'Please review the highlighted fields. Your saved profile has not changed.'; summary.hidden = false;
    form.elements[Object.keys(errors)[0]].focus(); return;
  }
  state.profile = profile;
  const persisted = save(); fillProfile(); renderAll();
  const message = persisted ? 'Profile saved. Your matches have been updated.' : 'Profile updated for this page only. Browser storage is unavailable.';
  // Announce once, beside the action; the global status is above this long form.
  document.getElementById('app-status').textContent = '';
  requestAnimationFrame(() => {
    profileStatus.textContent = message;
    profileStatus.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    if (persisted) profileStatusTimer = setTimeout(() => { profileStatus.textContent = ''; }, 8000);
  });
});
const servicePreviews = {
  language: ['Language preparation', 'A preview of future study support, not an available course.', ['Set a Korean-language goal for your study plans.', 'Explore writing practice and preparation resources.', 'Course enrollment is not available.']],
  exams: ['Exam preparation guidance', 'Planning topics only. No registration or payment is performed.', ['Check dates and rules with the official test provider.', 'Plan preparation around your target requirements.']],
  arrival: ['Arrival roadmap', 'A planning outline, not immigration advice.', ['Verify requirements with the relevant official authority.', 'Prepare housing and arrival checklists.']],
  settlement: ['Settlement topics', 'A preview of life-in-Korea support.', ['Housing and local transportation.', 'SIM access and everyday essentials.', 'Residence-card and banking requirements to verify.']],
  community: ['Community support', 'No live groups or events are available.', ['Research writing circles.', 'Korean-language study groups.', 'Student connections before and after arrival.']],
  mentor: ['Mentor request preview', 'No message is sent and no booking is created.', ['Topic: preparation guidance.', 'Discuss your goals and pathway requirements.', 'This mentor is fictional.']],
};
document.addEventListener('click', event => {
  const start = event.target.closest('[data-start-application]');
  if (start) {
    const application = newApplication(state, start.dataset.startApplication);
    selectedApplication = application.id; const persisted = save(); renderAll(); location.hash = applicationRoute(application.id);
    announce(persisted ? 'Application preparation case created. No university receives a submission.' : 'Case created for this page only. Browser storage is unavailable.');
  }
  const service = event.target.closest('[data-preview]');
  if (service) {
    const [title, description, lines] = servicePreviews[service.dataset.preview];
    dialogTrigger = service; document.getElementById('dialog-title').textContent = title; document.getElementById('dialog-description').textContent = description;
    document.getElementById('dialog-content').replaceChildren(list(lines)); previewDialog.showModal();
  }
  if (event.target.closest('.dialog-close, .dialog-dismiss')) previewDialog.close();
  if (event.target.closest('[data-reset]')) { resetTrigger = event.target.closest('[data-reset]'); resetDialog.showModal(); resetDialog.querySelector('[data-cancel-reset]').focus(); }
  if (event.target.closest('[data-cancel-reset]')) resetDialog.close();
  if (event.target.closest('[data-confirm-reset]')) {
    state = defaultState(); selectedApplication = state.applications[0].id; clearErrors(); fillProfile();
    clearTimeout(profileStatusTimer); profileStatus.textContent = '';
    const persisted = save(); resetDialog.close(); renderAll(); location.hash = '#dashboard';
    announce(persisted ? 'Demo reset. Sara’s original profile, matches, case, documents, and tasks have been restored.' : 'Demo reset for this page. Browser storage is unavailable.');
  }
});
document.addEventListener('change', event => {
  const input = event.target;
  if (!input.matches('[data-task], [data-document]')) return;
  if (input.dataset.task) state.tasks.find(task => task.id === input.dataset.task).complete = input.checked;
  else applicationById(input.dataset.application).documents.find(doc => doc.id === input.dataset.document).ready = input.checked;
  const focusId = input.id; const persisted = save(); renderAll();
  document.getElementById(focusId)?.focus({ preventScroll: true });
  announce(persisted ? 'Preparation checklist updated. Your next action and dashboard now reflect this change.' : 'Checklist updated for this page only. Browser storage is unavailable.');
});
previewDialog.addEventListener('close', () => dialogTrigger?.isConnected && dialogTrigger.focus({ preventScroll: true }));
resetDialog.addEventListener('close', () => resetTrigger?.focus({ preventScroll: true }));
// Reconcile changes from another tab without silently overwriting an unsaved form draft.
window.addEventListener('storage', event => {
  if (event.key !== STORAGE_KEY) return;
  try { state = event.newValue ? restoreState(JSON.parse(event.newValue)) : defaultState(); }
  catch { state = defaultState(); save(); }
  if (!applicationById(selectedApplication)) selectedApplication = state.applications[0]?.id || null;
  if (parseRoute().name === 'opportunity' || parseRoute().name === 'applications') currentRoute = '';
  renderAll(); route(); announce('Demo state changed in another tab. Profile fields remain an unsaved draft until you save or reload.');
});
let profileStatusTimer;
const profileStatus = node('p', 'status-message profile-save-status'); profileStatus.id = 'profile-save-status';
profileStatus.setAttribute('role', 'status');
profileStatus.setAttribute('aria-live', 'polite');
profileStatus.setAttribute('aria-atomic', 'true');
form.querySelector('.profile-actions > p').before(profileStatus);
save(); fillProfile(); route(); if (startupNotice) announce(startupNotice);
