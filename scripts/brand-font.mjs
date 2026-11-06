// Optional webfonts come directly from their publisher, not from this repository.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export async function prepareBrandFont(outputDirectory) {
  const endpoint =
    "https://api.fontshare.com/v2/css?f[]=general-sans@400,500,700&display=swap";
  const response = await fetch(endpoint);
  if (!response.ok)
    throw new Error("Could not retrieve the optional font from Fontshare.");
  const css = await response.text();
  const blocks = [...css.matchAll(/@font-face\s*\{([^}]+)\}/g)];
  const assets = join(outputDirectory, "assets");
  mkdirSync(assets, { recursive: true });
  const declarations = [];
  for (const [, block] of blocks) {
    const weight = /font-weight:\s*(400|500|700)\s*;/.exec(block)?.[1];
    const location =
      /url\(['"]?(\/\/cdn\.fontshare\.com\/[^'"\s)]+\.woff2)['"]?\)/.exec(
        block,
      )?.[1];
    if (!weight || !location) continue;
    const font = await fetch("https:" + location);
    if (!font.ok)
      throw new Error(
        "Could not retrieve an optional font weight from Fontshare.",
      );
    const filename = `general-sans-${weight}.woff2`;
    writeFileSync(
      join(assets, filename),
      Buffer.from(await font.arrayBuffer()),
    );
    declarations.push(
      `@font-face{font-family:"General Sans";src:url("assets/${filename}") format("woff2");font-weight:${weight};font-display:swap;font-style:normal}`,
    );
  }
  if (declarations.length !== 3)
    throw new Error(
      "The optional font response did not contain the three requested weights.",
    );
  writeFileSync(
    join(outputDirectory, "brand-font.css"),
    declarations.join("\n") + "\n",
  );
}
