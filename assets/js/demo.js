// Phase 2 domain logic. All records are synthetic; scores are compatibility, not predictions.
export const STORAGE_KEY = 'my_hanguel_demo_v1';
export const VERSION = 1;
export const WEIGHTS = { academic: 30, language: 20, field: 25, funding: 15, location: 10 };
export const ENUMS = {
  academicLevel: ['Undergraduate student', 'Bachelor graduate', 'Master graduate'],
  degree: ['Bachelor’s', 'Master’s', 'Doctorate'],
  funding: ['Full funding preferred', 'Partial funding considered'],
  location: ['Open to locations across Korea', 'Seoul region preferred', 'Daejeon region preferred', 'Busan region preferred'],
};
export const PROFILE_LABELS = {
  fullName: 'full name', nationality: 'nationality', academicLevel: 'academic level', major: 'major',
  gpa: 'GPA', gpaScale: 'GPA scale', topik: 'TOPIK level', ielts: 'IELTS score', degree: 'target degree',
  interests: 'research interests', funding: 'funding preference', location: 'location preference',
};
const DOCUMENTS = ['Academic transcript', 'Resume / CV', 'Study plan', 'Passport copy'];
const TASKS = [
  ['requirements', 'Review opportunity requirements', 'Read the synthetic requirements and note any gaps.'],
  ['study-plan', 'Outline your study plan', 'Connect your academic goals and research interests to this pathway.'],
  ['passport', 'Review passport requirements', 'Review preparation guidance only; do not provide a real document.'],
  ['mentor', 'Read mentor guidance', 'Use the fictional mentor’s suggestions to refine your preparation.'],
];
const catalog = [
  { id: 'demo-ai-research', title: 'AI Research Pathway', institutionLabel: 'Science & technology university pathway', type: 'Research', degreeLevel: 'Master’s', academicLevels: ['Bachelor graduate', 'Master graduate'], fields: ['computer engineering', 'computer science', 'artificial intelligence'], researchAreas: ['ai', 'artificial intelligence', 'education'], minimumGpa: 3.5, gpaScale: 4, language: { ielts: 6.5 }, fundingType: 'full', location: 'Daejeon', demoDeadline: 21, description: 'Explore a fictional graduate pathway combining computing research and AI in education.' },
  { id: 'demo-graduate', title: 'Graduate Scholarship Pathway', institutionLabel: 'Korean university pathway', type: 'Graduate study', degreeLevel: 'Master’s', academicLevels: ['Bachelor graduate', 'Master graduate'], fields: ['computer engineering', 'engineering', 'computer science'], researchAreas: ['education', 'research'], minimumGpa: 3.2, gpaScale: 4, language: { topik: 3 }, fundingType: 'full', location: 'Seoul', demoDeadline: 14, description: 'A fictional full-funding scenario for students preparing a research-led graduate study plan.' },
  { id: 'demo-engineering', title: 'Applied Engineering Pathway', institutionLabel: 'Technology university pathway', type: 'Applied study', degreeLevel: 'Master’s', academicLevels: ['Bachelor graduate', 'Master graduate'], fields: ['computer engineering', 'mechanical engineering', 'engineering'], researchAreas: ['robotics', 'industry', 'systems'], minimumGpa: 3, gpaScale: 4, language: { topik: 4 }, fundingType: 'partial', location: 'Busan', demoDeadline: 30, description: 'A fictional career-focused pathway in applied engineering and practical systems.' },
  { id: 'demo-design', title: 'Design & Culture Pathway', institutionLabel: 'Arts & design university pathway', type: 'Creative study', degreeLevel: 'Master’s', academicLevels: ['Bachelor graduate', 'Master graduate'], fields: ['design', 'visual communication', 'arts'], researchAreas: ['design', 'culture', 'visual'], minimumGpa: 3, gpaScale: 4, language: { topik: 4 }, fundingType: 'partial', location: 'Seoul', demoDeadline: 25, description: 'A fictional graduate pathway for creative practice, visual communication, and Korean culture.' },
  { id: 'demo-doctoral', title: 'Advanced Computing Research', institutionLabel: 'Graduate research institute pathway', type: 'Doctoral research', degreeLevel: 'Doctorate', academicLevels: ['Master graduate'], fields: ['computer engineering', 'computer science', 'artificial intelligence'], researchAreas: ['ai', 'education', 'research'], minimumGpa: 3.6, gpaScale: 4, language: { ielts: 7 }, fundingType: 'full', location: 'Daejeon', demoDeadline: 35, description: 'A fictional doctoral research scenario for students with a completed master’s background.' },
].map(item => ({ ...item, requirements: [
  `Target degree: ${item.degreeLevel}`, `Academic background: ${item.academicLevels.join(' or ')}`,
  `Minimum GPA scenario: ${item.minimumGpa} / ${item.gpaScale}`,
  item.language.topik ? `TOPIK expectation: level ${item.language.topik}` : `IELTS expectation: ${item.language.ielts}`,
  `Relevant fields: ${item.fields.join(', ')}`,
], nextSteps: ['Review the requirements and compatibility gaps.', 'Outline a study plan connected to this pathway.', 'Prepare checklist metadata and read mentor guidance.'] }));

export function defaultProfile() {
  return { fullName: 'Sara Ahmadi', nationality: 'Iranian', academicLevel: 'Bachelor graduate', major: 'Computer Engineering', gpa: 3.72, gpaScale: 4, topik: 3, ielts: 6.5, degree: 'Master’s', interests: 'AI in education', funding: 'Full funding preferred', location: 'Open to locations across Korea' };
}
export function profileValidation(raw) {
  const profile = {};
  const errors = {};
  for (const key of ['fullName', 'nationality', 'major', 'interests']) {
    profile[key] = typeof raw[key] === 'string' ? raw[key].trim().replace(/\s+/g, ' ') : '';
    const max = key === 'major' ? 120 : key === 'interests' ? 160 : 100;
    if (profile[key].length > max) errors[key] = `Use ${max} characters or fewer.`;
    if (key !== 'interests' && !profile[key]) errors[key] = `Please add your ${PROFILE_LABELS[key]}.`;
  }
  for (const [key, options] of Object.entries(ENUMS)) {
    profile[key] = raw[key];
    if (!options.includes(profile[key])) errors[key] = `Choose your ${PROFILE_LABELS[key]}.`;
  }
  for (const key of ['gpa', 'gpaScale', 'topik', 'ielts']) {
    const value = raw[key];
    profile[key] = value === '' || value === null || value === undefined ? null : Number(value);
    if (profile[key] !== null && !Number.isFinite(profile[key])) errors[key] = 'Please enter a valid number.';
  }
  if (![4, 4.3, 4.5, 5, 100].includes(profile.gpaScale)) errors.gpaScale = 'Choose a supported GPA scale.';
  if (profile.gpa !== null && (profile.gpa < 0 || profile.gpa > profile.gpaScale)) errors.gpa = `GPA must be between 0 and ${profile.gpaScale}.`;
  if (profile.topik !== null && (!Number.isInteger(profile.topik) || profile.topik < 0 || profile.topik > 6)) errors.topik = 'Choose a TOPIK level from 0 to 6.';
  if (profile.ielts !== null && (profile.ielts < 0 || profile.ielts > 9 || profile.ielts * 2 % 1 !== 0)) errors.ielts = 'Use an IELTS score from 0 to 9 in half-point steps.';
  return { profile, errors };
}
export function completion(profile) {
  const missing = Object.keys(PROFILE_LABELS).filter(key => profile[key] === null || profile[key] === '' || (key === 'topik' && profile.topik === 0));
  return { percent: Math.round((Object.keys(PROFILE_LABELS).length - missing.length) / Object.keys(PROFILE_LABELS).length * 100), missing };
}
const normalized = text => text.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
function includesTerm(text, terms) {
  const value = ` ${normalized(text)} `;
  return terms.some(term => value.includes(` ${normalized(term)} `));
}
export function match(profile, opportunity) {
  const degree = profile.degree === opportunity.degreeLevel;
  const level = opportunity.academicLevels.includes(profile.academicLevel);
  const gpaRatio = profile.gpa === null ? 0 : profile.gpa / profile.gpaScale;
  const minimum = opportunity.minimumGpa / opportunity.gpaScale;
  const academic = (degree ? 0.3 : 0) + (level ? 0.3 : 0) + 0.4 * Math.min(1, gpaRatio);
  const languageKey = opportunity.language.topik ? 'topik' : 'ielts';
  const expectation = opportunity.language[languageKey];
  const actual = profile[languageKey] || 0;
  const language = Math.min(1, actual / expectation);
  const majorFit = includesTerm(profile.major, opportunity.fields);
  const interestFit = includesTerm(profile.interests, opportunity.researchAreas);
  const field = (majorFit ? 0.6 : 0) + (interestFit ? 0.4 : 0);
  const fundingFit = profile.funding === 'Partial funding considered' || opportunity.fundingType === 'full';
  const funding = fundingFit ? 1 : 0.25;
  const locationFit = profile.location === 'Open to locations across Korea' || profile.location.startsWith(opportunity.location);
  const location = locationFit ? 1 : 0.25;
  const dimensions = { academic, language, field, funding, location };
  const score = Math.round(Math.max(0, Math.min(100, Object.entries(WEIGHTS).reduce((sum, [key, weight]) => sum + dimensions[key] * weight, 0))));
  const strengths = [], gaps = [], checks = [];
  if (degree && level) strengths.push('Academic level and target degree align'); else gaps.push('Academic level or target degree differs from this pathway');
  if (profile.gpa === null) checks.push('Add your GPA to check the academic requirement');
  else if (gpaRatio >= minimum) strengths.push('GPA meets the academic scenario');
  else gaps.push('GPA is below the scenario minimum');
  if (actual >= expectation) strengths.push(`${languageKey === 'topik' ? 'TOPIK' : 'IELTS'} meets the language expectation`);
  else if (!actual) checks.push(`Add a ${languageKey === 'topik' ? 'TOPIK' : 'IELTS'} score to check the language expectation`);
  else gaps.push(`${languageKey === 'topik' ? 'TOPIK' : 'IELTS'} is below the preferred level (${expectation})`);
  if (majorFit) strengths.push('Major aligns with the pathway'); else gaps.push('Major is outside the listed fields');
  if (interestFit) strengths.push(`Research interest aligns: ${profile.interests}`); else gaps.push('Research interests differ from this pathway');
  if (fundingFit) strengths.push('Funding preference aligns'); else gaps.push('Partial funding differs from your full-funding preference');
  if (locationFit) strengths.push('Location preference aligns'); else gaps.push(`${opportunity.location} differs from your location preference`);
  // Eligibility uses requirements only; funding, interests and location affect fit, not eligibility.
  const eligible = degree && level && gpaRatio >= minimum && actual >= expectation && majorFit;
  const hardGap = !degree || !level || (profile.gpa !== null && gpaRatio < minimum) || !majorFit;
  const status = eligible ? 'Likely eligible' : hardGap ? 'Not currently aligned' : 'Check requirement';
  return { score, strengths, gaps: [...checks, ...gaps], status, breakdown: Object.fromEntries(Object.entries(WEIGHTS).map(([key, weight]) => [key, Math.round(dimensions[key] * weight * 10) / 10])) };
}
export function ranked(state) {
  return state.opportunities.map(opportunity => ({ opportunity, result: match(state.profile, opportunity) })).sort((a, b) => b.result.score - a.result.score || a.opportunity.id.localeCompare(b.opportunity.id));
}
export function newApplication(state, opportunityId, id = `CASE-${crypto.randomUUID()}`) {
  const opportunity = state.opportunities.find(item => item.id === opportunityId);
  const existing = state.applications.find(item => item.opportunityId === opportunityId);
  if (existing) return existing;
  const app = { id, opportunityId, profileSnapshot: structuredClone(state.profile), matchAtCreation: match(state.profile, opportunity).score, createdAt: new Date().toISOString(), documents: DOCUMENTS.map((title, index) => ({ id: `doc-${index}`, title, ready: index < 2 })) };
  state.applications.push(app);
  TASKS.forEach(([key, title, description]) => state.tasks.push({ id: `${id}:${key}`, applicationId: id, key, title, description, complete: false }));
  return app;
}
export function defaultState() {
  const state = { metadata: { version: VERSION, startedAt: new Date().toISOString() }, profile: defaultProfile(), opportunities: structuredClone(catalog), applications: [], tasks: [], guidance: { name: 'Mina Park', fictional: true } };
  newApplication(state, 'demo-graduate', 'DEMO-001');
  // The original demonstration already selected a match; requirement review is complete.
  state.tasks.find(task => task.key === 'requirements').complete = true;
  return state;
}
export function deadline(state, opportunity) {
  return new Date(new Date(state.metadata.startedAt).getTime() + opportunity.demoDeadline * 86400000);
}
export function applicationStage(application, tasks) {
  return application.documents.every(doc => doc.ready) && tasks.filter(task => task.applicationId === application.id).every(task => task.complete) ? 'Review' : 'Documents';
}
export function guidance(state, application = null) {
  if (completion(state.profile).percent < 100) return 'Complete your study goals and missing profile fields so your matches reflect your preparation.';
  const applications = application ? [application] : state.applications;
  const unfinished = state.tasks.find(task => !task.complete && (!application || task.applicationId === application.id));
  if (unfinished) return `Focus on your next step: ${unfinished.title.toLowerCase()}. Connect your academic goals to the selected pathway.`;
  if (applications.some(app => app.documents.some(doc => !doc.ready))) return 'Your tasks are complete. Prepare the remaining checklist documents before planning a review; no real files should be provided.';
  if (applications.length) return 'Your preparation checklist is complete. Review the pathway requirements again; real submission is not available here.';
  const best = ranked(state)[0];
  if (best.result.gaps.some(gap => /TOPIK|IELTS/.test(gap))) return 'Your pathway has a language consideration. Review the required score alongside the academic fit before preparing an application.';
  return 'Explore your strongest profile matches, read the requirements, and choose a pathway to prepare.';
}
export function restoreState(value) {
  // Accept writable demo records only; never trust a stored catalog or HTML content.
  if (!value || value.metadata?.version !== VERSION || !Number.isFinite(Date.parse(value.metadata.startedAt))) throw Error('Incompatible demo state');
  const { profile, errors } = profileValidation(value.profile || {});
  if (Object.keys(errors).length) throw Error('Invalid stored profile');
  if (!Array.isArray(value.applications) || !Array.isArray(value.tasks) || value.applications.length > 5) throw Error('Invalid case state');
  const state = { metadata: { version: VERSION, startedAt: value.metadata.startedAt }, profile, opportunities: structuredClone(catalog), applications: [], tasks: [], guidance: { name: 'Mina Park', fictional: true } };
  const ids = new Set(), opportunities = new Set();
  for (const record of value.applications) {
    if (!record || typeof record.id !== 'string' || !/^[\w-]{1,80}$/.test(record.id) || ids.has(record.id) || opportunities.has(record.opportunityId) || !catalog.some(item => item.id === record.opportunityId)) throw Error('Invalid application');
    if (!Number.isFinite(Date.parse(record.createdAt)) || !Number.isInteger(record.matchAtCreation) || record.matchAtCreation < 0 || record.matchAtCreation > 100) throw Error('Invalid application metadata');
    const snapshot = profileValidation(record.profileSnapshot || {});
    if (Object.keys(snapshot.errors).length || !Array.isArray(record.documents) || record.documents.length !== 4) throw Error('Invalid snapshot');
    const docs = DOCUMENTS.map((title, index) => { const doc = record.documents[index]; if (doc.id !== `doc-${index}` || typeof doc.ready !== 'boolean') throw Error('Invalid documents'); return { id: doc.id, title, ready: doc.ready }; });
    state.applications.push({ id: record.id, opportunityId: record.opportunityId, createdAt: record.createdAt, profileSnapshot: snapshot.profile, matchAtCreation: record.matchAtCreation, documents: docs });
    ids.add(record.id); opportunities.add(record.opportunityId);
    for (const [key, title, description] of TASKS) {
      const entries = value.tasks.filter(task => task?.applicationId === record.id && task.key === key);
      if (entries.length !== 1 || typeof entries[0].complete !== 'boolean') throw Error('Invalid tasks');
      state.tasks.push({ id: `${record.id}:${key}`, applicationId: record.id, key, title, description, complete: entries[0].complete });
    }
  }
  if (value.tasks.length !== state.tasks.length) throw Error('Orphan tasks');
  return state;
}
