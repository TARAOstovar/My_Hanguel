'use strict';

// Fixed illustrative content for Phase 1; no AI calculation or persistence.
const opportunities = [
  { id: 'graduate', name: 'Graduate Scholarship Pathway', university: 'Illustrative Korean university', score: 94, funding: 'Full-funding scenario', deadline: '14 days remaining · demo', reasons: ['Graduate study goal', 'Strong sample GPA', 'Broad research interests'] },
  { id: 'research', name: 'AI Research Pathway', university: 'Illustrative science & technology university', score: 88, funding: 'Research-support scenario', deadline: '21 days remaining · demo', reasons: ['Computer Engineering background', 'AI in education interest', 'English study preference'] },
  { id: 'career', name: 'Applied Engineering Pathway', university: 'Illustrative technology university', score: 81, funding: 'Partial-funding scenario', deadline: '30 days remaining · demo', reasons: ['Major alignment', 'Career-focused study', 'Further Korean preparation suggested'] }
];
const screens = new Map(Array.from(document.querySelectorAll('[data-screen]'), screen => [screen.dataset.screen, screen]));
const dialog = document.getElementById('preview-dialog');
let dialogTrigger = null;
let currentRoute = null;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function opportunityCard(opportunity, compact) {
  const card = element('article', compact ? 'card opportunity-card' : 'match-card');
  const score = element('div', 'score-ring', `${opportunity.score}%`);
  score.style.setProperty('--score', `${opportunity.score}%`);
  score.setAttribute('aria-label', `Demo profile match: ${opportunity.score} percent. Not admission probability.`);
  const content = element('div', 'opportunity-content');
  content.append(element('span', 'badge cyan', 'Demo profile match'), element('h3', '', opportunity.name), element('p', 'university-label', opportunity.university));
  const facts = element('dl', 'opportunity-facts');
  for (const [label, value] of [['Funding', opportunity.funding], ['Deadline', opportunity.deadline]]) {
    const row = element('div'); row.append(element('dt', '', label), element('dd', '', value)); facts.append(row);
  }
  content.append(facts, element('p', 'reason-label', 'Why this sample profile matches'));
  const reasons = element('ul', 'match-reasons');
  opportunity.reasons.forEach(reason => reasons.append(element('li', 'reason', reason)));
  content.append(reasons);
  const button = element('button', 'soft', 'Preview this demo match');
  button.type = 'button'; button.dataset.opportunity = opportunity.id;
  button.setAttribute('aria-label', `Preview ${opportunity.name} demo match`);
  card.append(score, content, button);
  return card;
}

document.querySelectorAll('[data-opportunity-list]').forEach(container => {
  opportunities.forEach(opportunity => container.append(opportunityCard(opportunity, container.dataset.opportunityList !== 'workspace')));
});

function route() {
  const requested = window.location.hash.slice(1) || 'home';
  const name = screens.has(requested) ? requested : 'home';
  if (requested !== name || !window.location.hash) {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${name}`);
  }
  if (name === currentRoute) return;
  if (dialog.open) dialog.close();
  screens.forEach((screen, key) => { screen.hidden = key !== name; screen.classList.toggle('active', key === name); });
  document.body.classList.toggle('is-workspace', name !== 'home');
  document.querySelectorAll('.workspace-nav a, .public-nav a, .workspace-home, .brand').forEach(link => {
    const active = link.getAttribute('href') === `#${name}`;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  const heading = screens.get(name).querySelector('h1');
  document.title = `${name === 'home' ? 'Study and Life in Korea' : { dashboard: 'Dashboard', profile: 'My Profile', opportunities: 'Opportunities', applications: 'My Applications', services: 'Services', mentor: 'My Mentor' }[name]} | My_Hanguel`;
  heading.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'instant' });
  currentRoute = name;
}
window.addEventListener('hashchange', route);
window.addEventListener('popstate', route);

document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  const main = document.getElementById('main-content');
  main.focus(); main.scrollIntoView();
});

function preview(title, description, lines, trigger) {
  dialogTrigger = trigger;
  document.getElementById('dialog-title').textContent = title;
  document.getElementById('dialog-description').textContent = description;
  const content = document.getElementById('dialog-content'); content.replaceChildren();
  const list = element('ul', 'preview-list');
  lines.forEach(line => list.append(element('li', '', line)));
  content.append(list);
  dialog.showModal();
}
const servicePreviews = {
  language: ['Language preparation', 'A preview of future study support, not an available course.', ['Set a Korean-language goal for your study plans.', 'Explore writing practice and preparation resources.', 'Course enrollment is coming in a later phase.']],
  exams: ['Exam preparation guidance', 'Planning topics only. No exam registration or payment is performed.', ['Check current dates and rules with the official test provider.', 'Plan preparation around your target language requirements.', 'The demo has no payment records or registration status.']],
  arrival: ['Arrival roadmap', 'An illustrative planning outline, not immigration advice.', ['Verify visa requirements with the relevant official authority.', 'Prepare your housing and arrival checklist.', 'Confirm university arrival instructions through official channels.']],
  settlement: ['Settlement topics', 'A preview of life-in-Korea support.', ['Housing and local transportation.', 'SIM access and everyday essentials.', 'Residence-card and banking requirements to verify after arrival.']],
  community: ['Community support', 'Explore the concept. No live groups or events are available.', ['Research writing circles.', 'Korean-language study groups.', 'Student connections before and after arrival.']],
  mentor: ['Mentor request preview', 'In a future request, you could share your study goals and ask for preparation guidance.', ['Topic: feedback on a graduate study plan.', 'Context: Computer Engineering and AI in education.', 'Next step in the future product: send a request to an available mentor. Nothing is sent now.']]
};
document.addEventListener('click', event => {
  const opportunityButton = event.target.closest('[data-opportunity]');
  if (opportunityButton) {
    const opportunity = opportunities.find(item => item.id === opportunityButton.dataset.opportunity);
    preview(opportunity.name, `${opportunity.score}% illustrative profile compatibility, not admission probability. This is a concept preview, not a verified opportunity detail page.`, [opportunity.university, `Funding: ${opportunity.funding}`, `Deadline: ${opportunity.deadline}`, ...opportunity.reasons, 'Verified eligibility, official sources, and application creation are planned for Phase 2.'], opportunityButton);
  }
  const serviceButton = event.target.closest('[data-preview]');
  if (serviceButton && servicePreviews[serviceButton.dataset.preview]) {
    preview(...servicePreviews[serviceButton.dataset.preview], serviceButton);
  }
  if (event.target.closest('.dialog-close, .dialog-dismiss')) dialog.close();
});
dialog.addEventListener('close', () => { if (dialogTrigger && dialogTrigger.isConnected) dialogTrigger.focus({ preventScroll: true }); });

document.getElementById('profile-demo').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  preview('Your profile summary preview', 'This reflects your current field edits only. It is not saved and does not change demo matching.', [`Name: ${data.get('fullName')}`, `Nationality: ${data.get('nationality')}`, `Academic background: ${data.get('academicLevel')} · ${data.get('major')}`, `Target: ${data.get('degree')} · ${data.get('interests')}`, `Languages: TOPIK ${data.get('topik')} · IELTS ${data.get('ielts') || 'not provided'}`, `Preferences: ${data.get('funding')} · ${data.get('location')}`], event.submitter);
});
route();
