# Learning Room release evidence

Verified 5 November 2026. Product state: public demonstration with fictional information. Institutional learner use, educational effectiveness, grants and endorsements remain unconfirmed.

## Published services

- Frontend: https://orbiting0314.github.io/learning-room-platform/
- Workspace: https://orbiting0314.github.io/learning-room-platform/#/today
- Product plan: https://orbiting0314.github.io/learning-room-platform/#/plan
- Downloadable plan: https://orbiting0314.github.io/learning-room-platform/assets/product-plan.md
- API health: https://learning-room-api.150.109.157.214.sslip.io/health
- Repository: https://github.com/Orbiting0314/learning-room-platform

The frontend and plan download returned HTTP 200 over HTTPS. The API returned `status: ok`, `mode: demonstration`, `persistence: sqlite` and release `9000ccb563780805f3a0721768a6e2daae371a7f`. Coolify reported the application `running:healthy` and deployment `2ffanjpmurc3j0j68zepuamz` finished with that same commit. The backend is pinned to that code release; later frontend/documentation-only commits do not change the API image.

GitHub Actions run `41987051983` passed verification, static build and Pages deployment for the code release. Subsequent frontend-only publication is recorded in the repository's Actions history.

The API certificate names its actual `sslip.io` hostname and was issued by Let's Encrypt. Its inspected validity period was 5 November 2026 to 3 February 2027. No custom domain or DNS account change was made.

## Checks completed

- 19 domain/API tests passed locally and in the frontend verification workflow. Coverage includes workspace isolation, expiry, export without tokens, deletion scope, revision conflicts, input validation, database persistence, dates/timezone, teacher/room/learner conflicts, availability, capacity including community places, lesson timing and independent challenge marks.
- 13 grouped browser integration checks passed against the actual GitHub Pages frontend and Coolify API. These included teacher-approved note creation, explanatory core feedback, teacher-reviewed writing, separated print handouts, styled errors, learner creation and school filters, reflection with separate bonus marks, conflict handling, class editing/cancellation, signed impact entries and reload persistence.
- All six workspace routes were checked at 768px and 390px without document overflow. The learner matrix scrolls inside its table container. Custom menus were inspected open at desktop, tablet and mobile sizes and exercised with keyboard input.
- The taste-skill public-page inspector passed at 1440, 768 and 390px with zero failures. Its video warning is documented in the design review; authentic product screenshots and the actual tool supply the proof. The product-plan page also had zero inspector failures at 390px; its wide comparison tables intentionally scroll inside labelled containers.
- A disposable live workspace with a saved seventh learner and revision 2 survived API replacement across deployment. The fixture was then removed. The test kept its access token in process memory and did not write it to source, logs or artifacts.
- The live browser run reported no JavaScript exceptions. Only its own fictional workspace was deleted during cleanup.
- Automated axe checks of WCAG A/AA rules found no violations across the product page, product plan and six workspace routes after review. A transient contrast issue in a folder entrance was corrected by keeping the folder opaque while it moves. This automated scan is not a full accessibility certification. The skip link was separately checked to focus the main content without changing the current route.

Local screenshots and machine-readable reports are in ignored `artifacts/` and `.taste-skill/inspect/` directories. They contain fictional samples. No actual learner information or access tokens were saved as evidence.

## Deployment operations

The new Coolify application's automatic network was absent because Docker's default address pool was exhausted. After a read-only subnet and route inventory, an isolated network for this application was created on unused subnet `10.240.240.32/28`. No existing network, client container or proxy was restarted or removed. The API container has no published host port; HTTPS routing is through Coolify.

SQLite is stored in `ncv5prgpnhz3ij6toyue5tdo_learning-room-data`. This persistent volume was verified across replacement. An offsite backup and a disaster-recovery drill have not been established by this demonstration.

Coolify initially extracted a literal `SOURCE_COMMIT=unknown` from the first Compose template. For this release, its build-time `SOURCE_COMMIT` and application `git_commit_sha` were explicitly set to the verified full code commit. The image exposes that release identity through `/health`.

For future API releases, set both values to the intended full commit before deployment, wait for terminal completion, then compare the provider's deployed commit with the public health response. Keep the API pin on its accepted code release when only the frontend or documentation changes. Frontend deployment remains the GitHub Actions Pages workflow. Automatic backend deployment is disabled.

## Institutional pilot prerequisites

Before real learner information is introduced: accountable teacher identities and roles, centre-level access controls, institutional notices and consent arrangements, safeguarding ownership, retention and rights-handling procedures, offsite backups and recovery testing, security review and independent education evaluation. The current public demonstration intentionally uses fictional workspaces.

The ESG register holds reported evidence and explicit limitations. It is not verified impact accounting, a carbon certificate or a funding approval. QEF, SIE and ECF route constraints and source links are in the product plan.
