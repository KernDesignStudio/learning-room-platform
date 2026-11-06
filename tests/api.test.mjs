import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../server/index.mjs";

async function fixture(options = {}) {
  const app = createApp({ dbPath: ":memory:", serveStatic: false, ...options });
  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${app.server.address().port}`;
  const req = async (path, { token, method = "GET", body, origin } = {}) => {
    const response = await fetch(base + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(origin ? { Origin: origin } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return {
      status: response.status,
      body: await response.json(),
      headers: response.headers,
    };
  };
  return { app, req };
}
const learner = {
  alias: "Robin",
  school: "Sample Primary",
  grade: "P5",
  access: "Centre tablet",
  focus: "Grammar",
  availability: [{ day: "Saturday", start: "14:00", end: "19:00" }],
};

test("workspaces are isolated; unknown and expired tokens do not grant access", async (t) => {
  const { app, req } = await fixture();
  t.after(app.close);
  assert.equal((await req("/api/workspace")).status, 401);
  const first = (await req("/api/workspaces", { method: "POST" })).body;
  const second = (await req("/api/workspaces", { method: "POST" })).body;
  assert.notEqual(first.token, second.token);
  const saved = await req("/api/learner", {
    method: "POST",
    token: first.token,
    body: { revision: 1, data: learner },
  });
  assert.equal(saved.status, 201);
  assert.equal(saved.body.state.learners.length, 7);
  const other = await req("/api/workspace", { token: second.token });
  assert.equal(other.body.state.learners.length, 6);
  const exported = await req("/api/export", { token: first.token });
  assert.equal(JSON.stringify(exported.body).includes(first.token), false);
  app.db.prepare("UPDATE workspaces SET expires_at = 0").run();
  assert.equal(
    (await req("/api/workspace", { token: first.token })).status,
    401,
  );
});
test("revision checks prevent lost updates and invalid data does not advance revision", async (t) => {
  const { app, req } = await fixture();
  t.after(app.close);
  const first = (await req("/api/workspaces", { method: "POST" })).body;
  const params = {
    method: "POST",
    token: first.token,
    body: { revision: 1, data: learner },
  };
  assert.equal((await req("/api/learner", params)).status, 201);
  assert.equal((await req("/api/learner", params)).status, 409);
  const invalid = await req("/api/learner", {
    ...params,
    body: { revision: 2, data: { ...learner, alias: "", grade: "P1" } },
  });
  assert.equal(invalid.status, 422);
  assert.equal(
    (await req("/api/workspace", { token: first.token })).body.revision,
    2,
  );
});
test("origin policy, sensitive static paths and malformed bodies are denied", async (t) => {
  const { app, req } = await fixture();
  t.after(app.close);
  assert.equal(
    (
      await req("/api/workspaces", {
        method: "POST",
        origin: "https://unrelated.example",
      })
    ).status,
    403,
  );
  const allowedOrigins = [
    "https://kerndesignstudio.github.io",
    "https://orbiting0314.github.io",
  ];
  let allowed;
  for (const origin of allowedOrigins) {
    allowed = await req("/api/workspaces", { method: "POST", origin });
    assert.equal(allowed.status, 201);
    assert.equal(allowed.headers.get("access-control-allow-origin"), origin);
  }
  assert.equal((await req("/.local/learning-room.sqlite")).status, 404);
  assert.equal(
    (
      await req("/api/learner", {
        token: allowed.body.token,
        method: "POST",
        body: { revision: 1, data: null },
      })
    ).status,
    422,
  );
  const health = await req("/health");
  assert.equal(health.status, 200);
  assert.equal(health.body.mode, "demonstration");
});
test("deletion affects only the caller workspace", async (t) => {
  const { app, req } = await fixture();
  t.after(app.close);
  const first = (await req("/api/workspaces", { method: "POST" })).body;
  const second = (await req("/api/workspaces", { method: "POST" })).body;
  assert.equal(
    (await req("/api/workspace", { method: "DELETE", token: first.token }))
      .status,
    200,
  );
  assert.equal(
    (await req("/api/workspace", { token: first.token })).status,
    401,
  );
  assert.equal(
    (await req("/api/workspace", { token: second.token })).status,
    200,
  );
});
test("persistent SQLite state survives a service restart", async () => {
  const dir = mkdtempSync(join(tmpdir(), "learning-room-test-"));
  const dbPath = join(dir, "workspace.sqlite");
  const a = await fixture({ dbPath });
  try {
    const first = (await a.req("/api/workspaces", { method: "POST" })).body;
    await a.req("/api/learner", {
      token: first.token,
      method: "POST",
      body: { revision: 1, data: learner },
    });
    await a.app.close();
    const b = await fixture({ dbPath });
    try {
      const loaded = await b.req("/api/workspace", { token: first.token });
      assert.equal(loaded.body.revision, 2);
      assert.equal(loaded.body.state.learners.at(-1).alias, "Robin");
    } finally {
      await b.app.close();
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
