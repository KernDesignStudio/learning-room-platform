// Keeps this disposable fixture's access token in process memory across a deployment.
import assert from "node:assert/strict";
const api =
  process.env.API_ORIGIN ||
  "https://learning-room-api.150.109.157.214.sslip.io";
let token;
async function request(path, method = "GET", body) {
  const response = await fetch(api + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  assert.ok(response.ok, `API status ${response.status}`);
  return response.json();
}
try {
  const created = await request("/api/workspaces", "POST");
  token = created.token;
  await request("/api/learner", "POST", {
    revision: 1,
    data: {
      alias: "Persistence fixture",
      school: "Fictional test school",
      grade: "P5",
      focus: "",
      access: "Centre tablet",
      availability: [{ day: "Saturday", start: "14:00", end: "19:00" }],
    },
  });
  console.log(
    "Disposable persistence fixture saved. Waiting for deployment verification.",
  );
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(Error("Deployment verification timed out.")),
      300000,
    );
    process.stdin.once("data", () => {
      clearTimeout(timer);
      resolve();
    });
  });
  const loaded = await request("/api/workspace");
  const health = await request("/health");
  assert.equal(loaded.state.learners.at(-1).alias, "Persistence fixture");
  assert.equal(loaded.state.learners.length, 7);
  assert.equal(loaded.revision, 2);
  assert.match(health.release, /^[a-f0-9]{40}$/);
  console.log(
    JSON.stringify({
      preservedAcrossDeployment: true,
      learners: loaded.state.learners.length,
      revision: loaded.revision,
      release: health.release,
    }),
  );
} finally {
  if (token) {
    await request("/api/workspace", "DELETE");
    console.log("Only the disposable verification workspace was removed.");
  }
  process.stdin.pause();
}
