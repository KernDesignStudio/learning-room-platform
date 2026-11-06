# Developing your own version

## Local application

Use Node.js 24 or later, then run `npm start`. The local service serves `public/` and the application API together at `http://127.0.0.1:8788`.

The browser's local configuration uses a same-origin API. It does not send your local records to the online demonstration. SQLite data is stored under `.local/`, which is excluded from Git.

`npm test` runs domain and API tests without installing packages. `npm run check` checks JavaScript syntax. `npm run build` creates static files in `dist/`.

## Optional browser checks

Run `npm ci` and `npx playwright install chromium`, start the local application in another terminal, and run `npm run test:browser`.

If Google Chrome is already installed, you can use `BROWSER_CHANNEL=chrome npm run test:browser` instead of downloading Chromium. Use your shell's environment-variable syntax on Windows. Screenshots and reports go into ignored `artifacts/` folders.

## Your own hosting

A static frontend needs a separately reachable application service. The included workflow builds and tests the source on a push to `main`. It publishes to GitHub Pages only when you explicitly enable it for your own repository.

For your own fork:

1. Deploy your own application service and persistent data storage.
2. Set its `ALLOWED_ORIGINS` to your own frontend origin, and set `SERVE_STATIC=false` when serving only the API.
3. Add a GitHub repository variable named `LEARNING_ROOM_API_ORIGIN` with your service's HTTPS origin, without a trailing slash.
4. Enable GitHub Pages with GitHub Actions as its source, then set the repository variable `ENABLE_PAGES_DEPLOY` to `true`.

An empty API origin means the static build expects a service on the same origin. Copying the frontend to a static host alone does not create that service.

Other local service options are `PORT`, `DB_PATH` and `ALLOWED_ORIGINS`. Leave `TRUST_PROXY` disabled unless the service is behind a reverse proxy you control. Add actual secrets only to private runtime configuration, never to source.

## Optional brand font

The source version uses an Arial/sans-serif fallback. The original design uses General Sans, licensed separately by Indian Type Foundry through Fontshare.

If you obtain the font directly from its publisher and its terms fit your own use, a build with `BRAND_FONT=general-sans` downloads the unmodified files into `dist/`. The Pages workflow reads the equivalent `LEARNING_ROOM_BRAND_FONT` repository variable. See [third-party notices](../THIRD_PARTY_NOTICES.md).

## Before working with real learners

This repository is a teaching prototype with fictional examples. The [product plan](product-plan.md) sets out the institutional privacy, access, safeguarding, content review and evaluation work needed for a real learner pilot. Keep those decisions separate from getting a local prototype to run.
