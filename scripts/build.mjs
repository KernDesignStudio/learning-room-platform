import {
  cpSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  readFileSync,
} from "node:fs";
import { prepareBrandFont } from "./brand-font.mjs";
const api = (process.env.API_ORIGIN || "").trim();
if (api && !/^https:\/\/[a-z0-9.-]+(?::\d{1,5})?$/.test(api))
  throw new Error(
    "API_ORIGIN must be an HTTPS origin without a trailing slash.",
  );
rmSync("dist", { recursive: true, force: true });
cpSync("public", "dist", { recursive: true });
// Optional locally obtained fonts must never be copied into the default source build.
for (const weight of [400, 500, 700])
  rmSync(`dist/assets/general-sans-${weight}.woff2`, { force: true });
if (process.env.BRAND_FONT === "general-sans") await prepareBrandFont("dist");
writeFileSync(
  "dist/config.js",
  `export const API_ORIGIN = ${JSON.stringify(api)};\n`,
);
mkdirSync("dist/assets", { recursive: true });
cpSync("docs/product-plan.md", "dist/assets/product-plan.md");
const html = readFileSync("dist/index.html", "utf8").replaceAll(
  "__API_ORIGIN__",
  api,
);
writeFileSync("dist/index.html", html);
writeFileSync("dist/.nojekyll", "");
console.log(
  `Static frontend built for ${api || "a same-origin teaching service"}`,
);
