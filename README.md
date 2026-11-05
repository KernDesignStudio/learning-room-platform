# Learning Room

A standalone learning-centre product pilot by KERN Design Studio, built on 5 November 2026. English P4 to P6; all starting learner and school information is fictional.

- Frontend: https://orbiting0314.github.io/learning-room-platform/
- Teaching workspace: https://orbiting0314.github.io/learning-room-platform/#/today
- Product and pilot plan: https://orbiting0314.github.io/learning-room-platform/#/plan
- API health: https://learning-room-api.150.109.157.214.sslip.io/health

See [the full product plan](docs/product-plan.md) for the problem mapping, pedagogy, environmental/social/governance measures, economic assumptions, current funding constraints and proposed evaluation. Publication and live verification are recorded separately in `docs/release.md` when completed.

## Workflows

1. Open the teaching workspace. A separate demonstration workspace is created and saved on the API.
2. Prepare a lesson in Lesson studio. Choose a skill activity and Support, Core or Stretch route, edit the objective/instructions, select learners and adjust the lesson rhythm.
3. Review suitability, mark teacher approval and save a separate teaching-note version.
4. Open Learner preview, try core answers, inspect explanatory feedback and try the optional writing challenge. Writing uses a review rubric, without an automatic grade.
5. Print a learner activity without the teacher’s answer feedback or private notes.
6. Add fictional learner aliases with school, availability and access preference. Record an observation to update one skill at a time.
7. Plan, edit or cancel a dated class. The API checks teacher, room and learner conflicts, changeover buffers, capacity and availability. Cancelled records retain their history.
8. Record print/preparation baselines, actual figures, community places offered/used and neighbour incidents with a source note. Differences may be negative; no carbon conversion is made.
9. Export the workspace or use About this demo to delete it from the server.

## Run and verify

Node.js 24 is required. No npm installation or runtime dependencies are needed.

```sh
npm start
npm test
npm run check
npm run build
```

The local server is at http://127.0.0.1:8788 and serves `public/` with the same-origin API. `npm run build` copies the static app to `dist/`, writes its API configuration and includes the product plan. The frontend uses hash routes so a GitHub Pages project path works without server routing.

Environment options: `PORT` (8788), `DB_PATH` (`.local/learning-room.sqlite`), `ALLOWED_ORIGINS` (comma-separated origins), `SERVE_STATIC` (false in the API container), `RELEASE_SHA` (deployment identity), `API_ORIGIN` (static build only). No credentials belong in source or CLI output.

## Boundaries

This public demonstration is not an institutional student-record system. Use fictional information only. Browser storage contains a high-entropy workspace access token. The API stores only its hash; anyone using the same browser profile can access the demonstration workspace. Workspaces expire seven days after creation or their latest save. Cleanup occurs on subsequent API traffic. A persistent Docker volume is not an offsite backup.

Practice responses stay in tab memory. There is no model API, external analytics, paid messaging, school-data integration or payment processing. The current sample library is curated and original. Outcomes, partnerships, endorsements and funding eligibility are unconfirmed. All numbers in the economic model and pilot targets are assumptions.

Real learner use requires accountable accounts and roles, institutional privacy/consent arrangements, safeguarding, backups and recovery drills, and independent review. These are described in the plan; they are not claimed as delivered production controls.

## Deployment

The GitHub Actions workflow tests and builds the frontend, then publishes it to GitHub Pages. Coolify builds `docker-compose.yml` as the separate `learning-room-api` application with a persistent named SQLite volume, a health check and bounded resources. The API uses an automatic `sslip.io` HTTPS hostname. The existing `learning-centre-demo`, `KDS-Edtech` and other client resources are separate.

Coolify project: `Learning Room` (`j31f0ehepmyifhg8ljuolopi`). Application: `learning-room-api` (`ncv5prgpnhz3ij6toyue5tdo`). Application resource identifiers are not credentials.

## Visual system

Taste-skill: “The page is the object”, seed `109926159`. Shared-objective lesson folders become the public-page composition. General Sans and a green-black/bone/jade palette carry into the teaching workspace. Product-page screenshots show this real application with fictional sample data. No AI images or stock classroom photography are used.

General Sans is by Indian Type Foundry, available via [Fontshare](https://www.fontshare.com/fonts/general-sans). Local font files avoid runtime third-party font requests.
