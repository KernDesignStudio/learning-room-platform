import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { randomBytes, createHash } from "node:crypto";
import { isIP } from "node:net";
import { mkdirSync, readFileSync, existsSync, chmodSync } from "node:fs";
import { dirname, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { InputError, makeSeed, applyAction, impactSummary } from "./domain.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const hash = (value) => createHash("sha256").update(value).digest("hex");
const TTL = 7 * 24 * 60 * 60 * 1000;

export function createApp(options = {}) {
  const path =
    options.dbPath ||
    process.env.DB_PATH ||
    resolve(root, ".local/learning-room.sqlite");
  if (path !== ":memory:")
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(path);
  db.exec(
    "PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS workspaces (token_hash TEXT PRIMARY KEY, state TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1, expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL)",
  );
  if (path !== ":memory:") chmodSync(path, 0o600);
  const allowed = new Set(
    (
      options.origins ||
      process.env.ALLOWED_ORIGINS ||
      "https://kerndesignstudio.github.io,https://orbiting0314.github.io,http://127.0.0.1:8788,http://localhost:8788"
    )
      .split(",")
      .map((v) => v.trim()),
  );
  const limits = new Map();
  let lastSweep = 0;
  const serveStatic =
    options.serveStatic ?? process.env.SERVE_STATIC !== "false";
  function rate(key, max, windowMs) {
    const now = Date.now();
    if (limits.size > 3000)
      for (const [k, v] of limits) if (v.until <= now) limits.delete(k);
    const current = limits.get(key);
    if (!current || current.until <= now) {
      limits.set(key, { count: 1, until: now + windowMs });
      return;
    }
    if (++current.count > max)
      throw new InputError(
        "Too many requests. Please wait a little and try again.",
        429,
      );
  }
  const server = createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );
    const origin = req.headers.origin;
    const send = (code, body) => {
      res.writeHead(code, {
        "Content-Type": "application/json; charset=utf-8",
      });
      res.end(JSON.stringify(body));
    };
    try {
      if (origin && !allowed.has(origin))
        throw new InputError("This origin is not permitted.", 403);
      if (origin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
      }
      if (req.method === "OPTIONS") {
        res.setHeader(
          "Access-Control-Allow-Methods",
          "GET, POST, DELETE, OPTIONS",
        );
        res.setHeader(
          "Access-Control-Allow-Headers",
          "Authorization, Content-Type",
        );
        res.setHeader("Access-Control-Max-Age", "600");
        res.writeHead(204);
        res.end();
        return;
      }
      const url = new URL(req.url, "http://localhost");
      if (url.pathname === "/health" && req.method === "GET") {
        db.prepare("SELECT 1").get();
        send(200, {
          status: "ok",
          product: "Learning Room",
          version: "0.1.0",
          release:
            process.env.SOURCE_COMMIT || process.env.RELEASE_SHA || "local",
          persistence: "sqlite",
          mode: "demonstration",
        });
        return;
      }
      if (!url.pathname.startsWith("/api/")) {
        if (!serveStatic || req.method !== "GET") {
          send(404, { error: "Not found." });
          return;
        }
        let decoded;
        try {
          decoded = decodeURIComponent(url.pathname);
        } catch {
          throw new InputError("Invalid path.", 400);
        }
        const target = resolve(
          root,
          "public",
          decoded === "/" ? "index.html" : decoded.slice(1),
        );
        if (
          !target.startsWith(resolve(root, "public") + "/") ||
          !existsSync(target)
        ) {
          send(404, { error: "Not found." });
          return;
        }
        const types = {
          ".html": "text/html; charset=utf-8",
          ".css": "text/css",
          ".js": "text/javascript",
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".webp": "image/webp",
          ".woff2": "font/woff2",
          ".md": "text/markdown; charset=utf-8",
          ".svg": "image/svg+xml",
        };
        res.writeHead(200, {
          "Content-Type": types[extname(target)] || "application/octet-stream",
        });
        res.end(readFileSync(target));
        return;
      }
      if (
        req.headers["content-type"] &&
        !req.headers["content-type"].startsWith("application/json")
      )
        throw new InputError("Send JSON data.", 415);
      const now = Date.now();
      if (now - lastSweep > 60000) {
        db.prepare("DELETE FROM workspaces WHERE expires_at < ?").run(now);
        lastSweep = now;
      }
      // The deployed container accepts traffic from one reverse proxy; use its appended hop.
      const forwarded =
        process.env.TRUST_PROXY === "true"
          ? String(req.headers["x-forwarded-for"] || "")
              .split(",")
              .at(-1)
              .trim()
          : "";
      const ip = hash(
        isIP(forwarded) ? forwarded : req.socket.remoteAddress || "unknown",
      );
      rate(`all:${ip}`, 300, 60000);
      async function json() {
        let size = 0;
        const chunks = [];
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 32768)
            throw new InputError("This request is too large.", 413);
          chunks.push(chunk);
        }
        try {
          const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          if (!body || typeof body !== "object" || Array.isArray(body))
            throw Error();
          return body;
        } catch {
          throw new InputError("Send a valid JSON object.", 400);
        }
      }
      if (url.pathname === "/api/workspaces" && req.method === "POST") {
        rate(`create:${ip}`, 15, 60 * 60 * 1000);
        if (
          db.prepare("SELECT COUNT(*) AS total FROM workspaces").get().total >=
          1000
        )
          throw new InputError(
            "The demonstration is at capacity. Please try again later.",
            503,
          );
        const token = randomBytes(32).toString("base64url");
        const state = makeSeed();
        db.prepare(
          "INSERT INTO workspaces (token_hash, state, expires_at, created_at) VALUES (?, ?, ?, ?)",
        ).run(hash(token), JSON.stringify(state), now + TTL, now);
        send(201, {
          token,
          state,
          revision: 1,
          expiresAt: new Date(now + TTL).toISOString(),
          impact: impactSummary(state),
        });
        return;
      }
      const token = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(
        req.headers.authorization || "",
      )?.[1];
      if (!token)
        throw new InputError(
          "Open a demonstration workspace to continue.",
          401,
        );
      const tokenHash = hash(token);
      const workspace = db
        .prepare(
          "SELECT * FROM workspaces WHERE token_hash = ? AND expires_at > ?",
        )
        .get(tokenHash, now);
      if (!workspace)
        throw new InputError(
          "This demonstration workspace has expired. Open a new one.",
          401,
        );
      rate(`workspace:${tokenHash}`, 100, 60000);
      const state = JSON.parse(workspace.state);
      if (url.pathname === "/api/workspace" && req.method === "GET") {
        send(200, {
          state,
          revision: workspace.revision,
          expiresAt: new Date(workspace.expires_at).toISOString(),
          impact: impactSummary(state),
        });
        return;
      }
      if (url.pathname === "/api/export" && req.method === "GET") {
        send(200, {
          product: "Learning Room",
          mode: "demonstration",
          exportedAt: new Date().toISOString(),
          state,
          impact: impactSummary(state),
          notice:
            "Fictional samples and teacher-entered demonstration records. No verified impact or carbon claim.",
        });
        return;
      }
      if (url.pathname === "/api/workspace" && req.method === "DELETE") {
        db.prepare("DELETE FROM workspaces WHERE token_hash = ?").run(
          tokenHash,
        );
        send(200, { deleted: true });
        return;
      }
      const action =
        /^\/api\/(learner|lesson|session|session-update|session-cancel|reflection|impact)$/.exec(
          url.pathname,
        )?.[1];
      if (action && req.method === "POST") {
        const body = await json();
        if (body.revision !== workspace.revision)
          throw new InputError(
            "This workspace changed in another tab. Reload before saving your draft.",
            409,
          );
        if (
          !body.data ||
          typeof body.data !== "object" ||
          Array.isArray(body.data)
        )
          throw new InputError("Provide the form data.", 422);
        const result = applyAction(state, action, body.data);
        const update = db
          .prepare(
            "UPDATE workspaces SET state = ?, revision = revision + 1, expires_at = ? WHERE token_hash = ? AND revision = ?",
          )
          .run(
            JSON.stringify(result.state),
            now + TTL,
            tokenHash,
            workspace.revision,
          );
        if (update.changes !== 1)
          throw new InputError(
            "This workspace changed in another tab. Reload before saving your draft.",
            409,
          );
        send(201, {
          state: result.state,
          record: result.record,
          revision: workspace.revision + 1,
          expiresAt: new Date(now + TTL).toISOString(),
          impact: impactSummary(result.state),
        });
        return;
      }
      send(404, { error: "Not found." });
    } catch (error) {
      if (res.headersSent) {
        res.end();
        return;
      }
      send(error instanceof InputError ? error.status : 500, {
        error:
          error instanceof InputError
            ? error.message
            : "The service could not complete this request. Please try again.",
      });
    }
  });
  return {
    server,
    db,
    close: () =>
      new Promise((resolveClose) => {
        server.close(() => {
          db.close();
          resolveClose();
        });
        server.closeIdleConnections();
      }),
  };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const app = createApp();
  const port = +(process.env.PORT || 8788);
  app.server.listen(port, "0.0.0.0", () =>
    console.log(`Learning Room listening on http://127.0.0.1:${port}`),
  );
  const shutdown = () => app.close().then(() => process.exit(0));
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
