# My_Hanguel

Your AI Gateway to Study and Life in Korea. This competition MVP connects a fictional student profile to explainable opportunity matches, opportunity details, preparation applications, case checklists, and a next-action dashboard.

## Run locally

```sh
python3 -m http.server 8001 --directory .
```

Open the server in a browser. No package installation, build, framework, or backend is required. `index.html` and `assets/styles.css` preserve the approved Phase 1.1 design. `assets/app.js` handles storage, rendering, forms, routing, and interactions; `assets/js/demo.js` holds the synthetic catalog, defaults, validation, matching, and case rules.

## Synthetic data and storage

Sara Ahmadi and Mina Park are fictional. All five pathways, institutions, funding scenarios, requirements, and deadlines are examples, not verified scholarship facts. There is no real AI model, authentication, university integration, messaging, payment, document upload, or live submission.

Use fictional profile information only. A single versioned state is stored under `my_hanguel_demo_v1` in localStorage for this browser/origin. Saving a profile, creating a case, and checking tasks/documents persist automatically; unsaved form edits do not affect shared state. Deadlines are synthetic windows anchored to the demo's first-load/reset time. Expired windows are explicitly labeled. Missing, corrupt, structurally invalid, or incompatible state restores the default demo. If storage is blocked/full, the app works in memory and displays that changes cannot survive refresh. Reset Demo requires confirmation and replaces only this app's namespaced record, leaving other localStorage keys intact.

The initial scenario contains Sara's original profile and one graduate preparation case, with transcript/CV marked ready and requirement review complete. All case/task/document titles and the opportunity catalog are canonical code data; persisted records cannot replace the catalog or inject HTML. Cross-tab updates refresh shared views without silently replacing a profile draft.

## Matching and completion

Profile Match is deterministic compatibility, **not admission or funding probability**. Whole-number results are clamped to 0–100. Weights:

| Dimension | Weight | Calculation |
| --- | ---: | --- |
| Academic | 30% | Degree alignment 30%, academic-level alignment 30%, normalized GPA 40% of this dimension |
| Language | 20% | Relevant TOPIK or IELTS score divided by the scenario expectation, capped at 1 |
| Field/research | 25% | Listed major alignment 60%, research-keyword alignment 40% of this dimension |
| Funding | 15% | Aligned funding 1; full-funding preference against partial funding 0.25 |
| Location | 10% | Open/aligned location 1; different preferred location 0.25 |

Major/interest matching uses case-insensitive whole phrases/words. Missing GPA/language data contributes zero for that component. Eligibility is separate: degree, academic background, normalized minimum GPA, listed major, and language expectation produce “Likely eligible,” “Check requirement,” or “Not currently aligned.” Funding, research interests, and location affect compatibility, not eligibility. Nationality is saved and displayed but there are no nationality restrictions in the synthetic catalog; no eligibility rules are inferred from nationality. Strengths and gaps come from the same calculation as the score.

Completion equally counts twelve saved meaningful fields, including relevant language fields; missing language scores and research interests produce useful guidance. Completion does not guarantee admission. GPA supports scales 4, 4.3, 4.5, 5, and 100; numeric comparisons normalize by scale.

## Applications and routing

Hash routes work on GitHub Pages, including under `/My_Hanguel/`: `#home`, `#dashboard`, `#profile`, `#opportunities`, `#opportunity?id=demo-ai-research`, `#applications`, `#applications?id=CASE-ID`, `#services`, and `#mentor`. Browser Back/Forward and reload retain the destination. Unknown screens/IDs fall back to home. Serve over HTTP because scripts use native browser modules and relative asset paths.

Each opportunity can have one case. Creation snapshots the saved profile and compatibility score, and generates four checklist documents and four tasks. The current match is recalculated from the saved profile; the original match remains explicitly labeled. The tracker treats Profile as linked/complete for case setup, independently of optional profile completion. The Documents stage becomes ready for Review only when all tasks and checklist items are ready. Checking tasks never triggers submission or results: these remain unavailable. Documents are booleans only—no file content or sensitive identifiers are requested.

Services remain a lightweight product vision. Mentor guidance is synthetic and contextual. There is no remote sync, real eligibility verification, or production storage security. localStorage is unsuitable for real personal/sensitive data. Browser storage can be cleared by the user or browser. Future production accounts, secure storage, verified catalog data, and integrations remain outside this phase.
