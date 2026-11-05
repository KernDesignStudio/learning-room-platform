# Learning Room: product and pilot plan

Prepared 5 November 2026. Product owner: KERN Design Studio. Working name: Learning Room. This is an independent product pilot, separate from the earlier Learning Room presentation demo and KDS-Edtech.

## Product decision

Build a teacher-led learning workspace for Hong Kong learning centres, initially covering English for P4 to P6. Connect preparation, teaching, observation, reflection and scheduling. The first release is a usable public demonstration with fictional learner information. It does not constitute an institutional student-record service or prove educational impact.

The product promise is to help a teacher adapt a shared objective to different needs, understand the evidence for each skill, and run a more accessible, considerate learning centre. The initial English UI and P4 to P6 scope are working assumptions inherited from the related presentation demo and applied explicitly to this new pilot.

## Who it serves

- Teacher: prepare suitable notes, choose scaffolding, plan lesson rhythm, observe and improve.
- Centre operator: coordinate rooms, learner availability, school backgrounds and community places.
- Learner: practise at an appropriate support level, receive useful feedback and try optional challenge.
- Community partner: help families access supported places, devices and print without exposing financial circumstances to classmates.
- Education evaluator: independently assess workload, content quality, learning evidence and equitable access.

No partner, evaluator, university, government body or community organisation has committed to this project.

## Problem and solution mapping

| Problem | Product response | Acceptance evidence |
| --- | --- | --- |
| Customised notes take too long | Shared objective; editable Support, Core and Stretch instructions; reusable saved teaching notes; learner preview and printable activities | Teacher can select a topic, adapt it, save, reopen and print it; compare preparation time against matched usual lessons |
| Learners want bonus challenges | Optional extension with an explanation task and a separate review rubric | Core performance remains separate; teachers can recognise persistence, explanation and transfer without masking misconceptions |
| Difficulties vary across English skills | Profiles for grammar, sentence structure, writing, listening and reading; evidence and next step by skill | A new observation updates only its selected skill and retains the evidence trail |
| Pacing and teaching quality need review | Editable lesson segments; exit ticket; contextual engagement observation; teacher reflection | Segment minutes match the lesson total; observation names learner evidence, next instruction and a teaching adjustment |
| Schools, availability and rooms are hard to coordinate | Fictional school records; availability windows; dated classes; capacity and shared-learner checks; changeover buffers | Invalid dates, over-capacity classes, unavailable learners and conflicting changeovers are rejected server-side |

## Six criteria and theory of change

### Environmental

Reusable materials and selective printing may reduce paper consumption. A print-sheet comparison requires a recorded baseline, comparable teaching volume and actual printing records. The metric is baseline sheets minus actual sheets, not an automatically verified saving. A negative value is an increase. During a real pilot, normalise by attended learner-session and separate mandatory accommodations from avoidable printing.

The system does not convert sheets to carbon. Hosting, network, device energy and device life have not been measured. A lightweight static frontend, locally hosted fonts, no tracking scripts and no runtime AI calls reduce avoidable service overhead, but do not establish a net environmental benefit. Record hosting invoices and resource use, device assumptions and print procurement before any lifecycle claim.

### Pedagogical

Use explicit objectives, teacher modelling, guided practice, independent practice, retrieval, actionable feedback, exit tickets and reflection. This design draws on EEF guidance about feedback and self-regulation. It does not inherit the effect sizes in the literature.

Differentiation changes scaffolding and task demand while preserving the objective. The same learner may need support in one skill and stretch in another. Suggested routes are editable, contextual and temporary. They are not diagnoses or permanent ability labels.

Core practice uses a transparent answer key and misconception explanation. Writing and reasoning require teacher review. Optional stretch work receives separate recognition; it must not distort core evidence or penalise learners who need more time. The pilot supports 0 to 3 teacher-awarded challenge marks, stored separately with required evidence for any award. The mark range is a pilot assumption to review with teachers.

Lesson segment lengths are editable planning choices. No universal attention-span formula is assumed. An engagement rating is a teacher observation in context, not a mental-health, disability or attention diagnosis. Evaluate teaching quality through sampled lesson review, learner work and teacher reflection, rather than one satisfaction score.

### Sustainable

Maintain an original, curated activity library with a version history, named content owner, review date and curriculum tags. The first release contains five original samples, one per skill area. Each sample has a shared objective, route instructions, a model, a likely misconception, an exit ticket and a review rubric.

Run a weekly issue review, monthly teacher feedback and accessibility review, and a termly education-adviser review. No adviser is appointed yet. Budget for technical maintenance, content review, support, accessibility work and independent evaluation. Keep portable data exports and printable materials to reduce dependence on one provider.

The service must survive beyond an initial grant through centre revenue or contracted institutional support. A grant is not recurring operating income until awarded under applicable conditions. The sustainability decision should consider teacher adoption, retention, content quality, unit cost and evidence of public benefit.

### Economic

Proposed model: a centre-level subscription pays for routine service, with a separately costed community allocation and eligible pilot/evaluation work. Validate willingness to pay before fixing public pricing. Avoid charging a child for a challenge route or basic accessibility support.

Illustrative model only, not a quotation or forecast:

- Centre subscription assumption: HK$480 per month.
- Fixed operating-cost assumption: HK$6,000 per month, including hosting, content review and a limited maintenance allocation.
- Variable support-cost assumption: HK$80 per centre per month.
- At 30 centres: HK$14,400 gross revenue; HK$2,400 variable cost; HK$6,000 fixed cost; HK$6,000 contribution before tax, acquisition cost and development-cost recovery.
- At these assumptions, operating break-even is 15 centres: 6,000 / (480 - 80).

These cost assumptions are unverified. Measure actual support minutes, salaries/contractor cost, content-review work, infrastructure bills, payment fees, acquisition cost and churn. Development recovery and community service must be budgeted separately. A 25% price reduction or support-cost increase should be tested before a scaling decision. Do not promise this price or subsidy publicly based on the model.

For a twelve-week pilot, prepare a bottom-up costed work breakdown for product work, content, teacher release time, evaluator time, accessibility, community partner delivery, devices, hosting, contingency and reporting. Obtain current supplier quotes and institutional procurement requirements. No pilot budget is approved by this document.

### Social

Reserve community places within actual room capacity. A partner-managed referral process should offer device loans or centre tablets, print packs, supported onboarding, accessible participation and scheduling flexibility. Never show poverty status to other learners. Do not require families to supply income proof through the public demo.

Track places offered, places used, attendance, completion, support required and reasons for non-participation. Monitor whether shared-device users or supported participants benefit less than others. Use an appropriately consented, privacy-preserving evaluation and suppress small aggregate groups when reporting. Collect qualitative feedback without making technology access a condition for basic learning.

Offer supervised peer explanation and collaborative tasks as part of teaching. Real family messaging, public learner communities and unsupervised child-to-child communication are outside the first release and require a safeguarding process.

Room capacity, learner availability and changeover buffers support calmer arrivals. They do not prove reduced noise. Record a comparable baseline of arrival congestion and reported neighbour incidents; review activity placement, building rules and feedback from the centre before claiming improvement. No environmental noise limit or legal compliance claim is made.

### Governance

ESG comprises environmental, social and governance considerations. It is not a universal grant eligibility certificate. Governance must cover institutional accountability, privacy, safeguarding, access, content review, complaints, procurement and evidence quality.

The public demonstration includes separate workspaces, high-entropy access tokens stored as hashes on the server, input validation, revision conflict checks, an activity history, workspace export and server deletion. An access token is not an institutional identity or staff role. Anyone using the same browser profile can access that workspace. Learner practice answers stay in tab memory. No external analytics or live model API is used.

Workspaces expire seven days after creation or the latest successful write. Expired rows are deleted during subsequent API traffic. Physical storage reclamation and backup retention are separate concerns. The demo is not a safe place for real child information, health labels, parent contacts or financial records. All starting names, schools, observations and schedules are fictional. Export excludes the access token.

Before real learner data: appoint the data controller and safeguarding lead; implement staff identity, least-privilege roles, centre separation, institutional notices, lawful consent/guardian arrangements as appropriate, data subject access/correction/deletion handling, retention rules, incident response, tested backups and an independent privacy/security review. Conduct research ethics review when the evaluation requires it. These are operational prerequisites, not claims of completed certification.

## Funding and endorsement strategy

The realistic objective is a reviewable public-benefit proposal with evidence, a suitable lead applicant and a continuation plan. Product features alone cannot guarantee funding, subsidy, academic support or Education Bureau endorsement.

| Route | Potential fit | Constraint checked on 5 November 2026 | Next step |
| --- | --- | --- | --- |
| School-led Quality Education Fund project | School-based innovation, student support and a defined evaluation | The published Dedicated Funding Programme guide is for publicly funded schools and eligible kindergartens; its projects are one-off and should not entail recurrent QEF expenditure | Ask a willing eligible school to assess fit under the correct programme; clarify applicant, procurement, non-profit project boundary, ownership and post-grant costs |
| SIE Fund through a suitable intermediary | Social innovation addressing poverty or social exclusion with a defined beneficiary pathway | General guidance includes individuals, NGOs and profit-making organisations subject to conditions. The official intermediary page lists third-batch innovative-programme applications as closed. No matching open call is confirmed | Confirm current intake with the relevant intermediary before budgeting or submitting; demonstrate underserved need, partner delivery and measurable access |
| Environment and Conservation Fund | Genuine environmental education or community action led by an eligible organisation | Official eligibility includes tax-exempt charities, local non-profit bodies and post-secondary institutions. No matching open call is confirmed. Generic paper-saving edtech is a weak basis | Consider only a substantive environmental workstream with an eligible partner and a matching current call; do not retrofit a green claim |
| University education research partnership | Independent evaluation, curriculum validation and teacher development | No university has been approached or committed; academic review, research funding, ethics clearance and endorsement are separate | Prepare a two-page study concept, protocol, anonymised sample output and costed work package; approach a relevant education research group when separately authorised |
| CSR/philanthropic sponsorship | Devices, supported places and community delivery | No sponsor or payment is committed | Cost a beneficiary-specific access programme; disclose selection, safeguarding and reporting arrangements |

Do not seek duplicate public funding for the same costs. Separate commercial service revenue from restricted grant expenditure. Keep letters of interest, research collaboration, procurement acceptance and public endorsement distinct. Do not use institution logos without authorisation. No applications or messages to institutions have been sent as part of this build.

## Proposed twelve-week evaluation

Recruitment targets, not current participants: two learning centres, four teachers, approximately 40 to 60 learners, one community partner and an independent evaluator. Propose 20 supported places, subject to actual capacity, referral arrangements and funding.

1. Weeks 1 to 2: agree the study questions, curriculum scope, comparison design, minimum detectable changes, consent, privacy responsibilities, accessibility accommodations and safeguarding. Invite teacher co-design. Do not enrol real children through the public demo.
2. Weeks 3 to 4: establish usual-practice baselines for preparation time, print sheets per attended learner-session, attendance, scheduling incidents and curriculum-aligned tasks.
3. Weeks 5 to 10: introduce the tool in stages or use matched teaching units. Keep teacher, topic, learner needs and lesson length comparable where possible. Collect preparation logs, independent lesson-quality ratings, learner work, access barriers and teacher burden.
4. Weeks 11 to 12: analyse paired comparisons and subgroup access gaps, report missing data, class/teacher clustering and sample-size limitations, and collect teacher/learner/partner feedback. Decide whether to improve, extend or stop.

Measures and proposed decision thresholds:

| Measure | Proposed target | Guardrail |
| --- | --- | --- |
| Preparation time | Explore 25% lower median matched preparation time | Independent lesson-quality ratings do not worsen |
| Printing | Explore 30% fewer sheets per attended learner-session | Preserve print accommodations and count rebound printing |
| Useful reflection | Aim for 80% of taught sessions with a useful evidence/next-step record | Record logging minutes and avoid excessive teacher burden |
| Core learning | Compare curriculum-aligned baseline, post and retention tasks | Report group comparability, missing data and uncertainty; no efficacy claim from demo scores |
| Community access | Measure offered places, uptake, attendance and completion for the proposed 20 supported places | Review access barriers and avoid stigmatising labels |
| Neighbour impact | Compare incidents and observed arrival congestion across equivalent periods | Absence of reports is not proof of no disturbance |
| Operating viability | Compare support and content-maintenance cost with validated revenue | Include post-grant costs and development recovery |

Targets are not product results. The public impact register starts with no records and never counts fictional initial data as achieved impact. Teacher-entered register records are labelled demonstration evidence and are not independently verified. Carbon values remain unset.

## Initial release and roadmap

### Delivered demonstration scope

- Public product page and product-plan page, plus downloadable plan.
- Separate persistent demonstration workspaces with expiry, export and deletion.
- Five original English sample activities covering five skill areas.
- Three editable instruction routes; teacher review; saved notes as separate versions.
- Learner practice preview, transparent core feedback and teacher review guidance for writing.
- Editable lesson rhythm and printable learner activities.
- Fictional learner profiles with school, availability, device/print preference and skill observations.
- Class planning with room/learner conflicts, capacity, reserved community places and changeover checks.
- Teacher reflections updating the selected learner skill and retaining evidence; optional challenge marks and their justification remain separate from core learning.
- Impact evidence log with signed differences, offered/used places, source notes and reported incidents.

### Next release priorities

1. Real teacher identity, centre administration, least-privilege roles and institutional data handling.
2. Supervised learner assignments, consented evidence collection, answer/teacher-pack separation and offline delivery with conflict-safe synchronisation.
3. Recurring schedules, school holiday calendars, controlled attendance records and room-policy settings.
4. Community-partner referral, subsidy accounting and device-loan operations outside learner-facing views.
5. Independent content validation, accessibility audit, security review and operational recovery exercises.
6. Curriculum expansion only after teacher review and pilot evidence support it. A future AI drafting feature requires a separate content, privacy, cost and evaluation decision.

## Technical architecture

- Frontend: dependency-free HTML, CSS and ES modules; hash routes; static output on GitHub Pages. No custom domain required.
- Backend: Node.js 24 HTTP service, server-side domain validation, rate limits, origin checks and revision-protected writes.
- Storage: SQLite in an isolated persistent named Docker volume on Coolify. Workspace states are scoped by hashed access token. A seven-day activity window limits demonstration retention.
- Deployment: GitHub Actions checks and publishes the frontend; Coolify builds the separate API from the repository and routes it over HTTPS using an automatic DNS service hostname. No other client service is changed.
- No paid API, AI model, analytics, messaging service, file upload, payment integration or real school data connection.
- Portability: JSON workspace export and printable activities. A future institutional export policy must distinguish learner records, safeguarding records and aggregate evaluation data.
- Operations: monitor API health and the deployed commit; retain release evidence; validate persistence across redeploy. A persistent volume is not an offsite backup. Production backups and restore drills are not established by this demonstration.

## Design and accessibility

Taste-skill direction: “The page is the object”, seed 109926159. The specific teaching artefact is the shared-objective lesson folder, whose three support routes and evidence notes become the page composition. General Sans typography and the green-black/bone palette connect the public page and the workspace. The main interactive proof is the real lesson studio and learner preview.

Public-page images are screenshots of this actual demonstration, not classroom photography or claims of real users. No AI image generation is used. Self-hosted General Sans is by Indian Type Foundry via Fontshare.

Controls use styled open/selected/focus/error/disabled states, visible labels, keyboard navigation and touch targets. No visible arrows or chevrons. Dates use a labelled text format; time and choice controls use custom accessible lists. Listening includes a transcript and optional device-generated speech. Motion has a reduced-motion fallback. Print and shared-device participation are supported. WCAG 2.2 AA is a design and review target, not a claimed third-party certification.

## Sources

Official sources reviewed on 5 November 2026; intake dates and conditions require checking at application time.

- [QEF Dedicated Funding Programme guide](https://www.qef.org.hk/en/application_guide/files/dfp_guide_to_applicants.pdf)
- [SIE Fund application eligibility and conditions](https://www.sie.gov.hk/en/faqs/about-innovative-projects.html)
- [SIE intermediary programme status](https://www.sie.gov.hk/en/intermediaries/engagement.html)
- [Environment and Conservation Fund eligibility](https://www.ecf.gov.hk/en/applications/index.html)
- [EEF feedback evidence](https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/feedback)
- [EEF metacognition and self-regulation](https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/metacognition-and-self-regulation)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [PCPD guidance on children and online learning](https://www.pcpd.org.hk/english/news_events/media_statements/press_20200402.html)
- [PRI environmental, social and governance issues](https://www.unpri.org/responsible-investment/sustainability-issues)
- [General Sans, Indian Type Foundry / Fontshare](https://www.fontshare.com/fonts/general-sans)

No grant, endorsement, partnership, carbon saving, student improvement or commercial traction is asserted by these references.
