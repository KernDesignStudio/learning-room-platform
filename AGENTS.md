# Learning Room

- This is the standalone learning-centre pilot requested on 5 November 2026. Preserve the existing learning-centre-demo, KDS-Edtech and their hosting.
- English P4 to P6 pilot. All starting learners, schools, sessions and observations are fictional. Public workspaces accept demonstration information only.
- No visible arrows, chevrons, emojis or em/en dashes. Use fully styled accessible controls, including open states. Do not call image generation without fresh explicit user approval.
- Use taste-skill for the public product page. The product interface uses the same palette and typography with task-appropriate accessible controls.
- Keep core evidence separate from optional challenge work. Do not automatically grade writing, infer diagnoses, or claim measured educational impact from samples.
- ESG means environmental, social and governance. Funding eligibility, certification, endorsement, partner commitments and impact results must never be invented.
- Frontend: GitHub Pages, no custom domain. API: isolated Coolify application with a persistent SQLite volume. Never alter other client resources.
- Backend tests must cover workspace isolation, validation, conflicting bookings and truthful impact calculations. Verify both live hosts after deployment.
- API releases are pinned. Set Coolify `git_commit_sha` and build-time `SOURCE_COMMIT` to the same full accepted commit, then verify provider status and `/health`. A frontend-only release does not require redeploying the API. Read docs/release.md before changing the deployment.
