// Integration checks in a disposable headless browser. Uses taste-skill's local browser driver.
// TASTE_BROWSER_MODULE can point to another copy of scripts/lib/cdp.mjs.
import assert from "node:assert/strict";
import { homedir } from "node:os";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { mkdirSync, writeFileSync } from "node:fs";
const modulePath =
  process.env.TASTE_BROWSER_MODULE ||
  join(homedir(), ".codex/skills/taste-skill/scripts/lib/cdp.mjs");
const { Browser, sleep } = await import(pathToFileURL(modulePath));
const base = process.env.TEST_URL || "http://127.0.0.1:8788/";
const browser = await Browser.launch();
const page = await browser.newPage();
const out = resolve(process.env.QA_DIRECTORY || "artifacts/browser");
mkdirSync(out, { recursive: true });
const passed = [];
const mark = (title) => {
  passed.push(title);
  console.log(`PASS ${title}`);
};
async function until(fn, message, timeout = 12000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await page.eval(fn)) return;
    await sleep(80);
  }
  throw new Error(`Timed out: ${message}`);
}
async function click(selector) {
  await page.eval((s) => {
    const el = document.querySelector(s);
    if (!el) throw Error("Missing " + s);
    el.click();
  }, selector);
}
async function fill(selector, value) {
  await page.eval(
    ({ s, v }) => {
      const el = document.querySelector(s);
      if (!el) throw Error("Missing " + s);
      el.value = v;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    },
    { s: selector, v: value },
  );
}
async function choose(name, value) {
  await page.eval(
    ({ name, value }) => {
      const input = document.querySelector(`[name="${name}"]`);
      const wrap = input.closest("[data-select]");
      wrap.querySelector(".select-toggle").click();
      const option = [...wrap.querySelectorAll("[data-option]")].find(
        (el) => el.dataset.option === value,
      );
      if (!option) throw Error("Missing choice " + name + " " + value);
      option.click();
    },
    { name, value },
  );
}
async function route(name) {
  await page.eval((name) => {
    location.hash = "/" + name;
  }, name);
  await until(
    () => !!document.querySelector(".workspace-main"),
    "workspace route",
  );
  await sleep(100);
}
async function submit(form) {
  await click(`[data-form="${form}"] button[type="submit"]`);
}
async function exportState() {
  return await page.eval(async () => {
    const { API_ORIGIN } = await import("./config.js");
    const token = localStorage.getItem("learning-room.workspace.v1");
    return (
      await fetch(API_ORIGIN + "/api/export", {
        headers: { Authorization: "Bearer " + token },
      })
    ).json();
  });
}
try {
  await page.goto(base + "#/today");
  await until(
    () =>
      document.querySelector("h1")?.textContent === "Today, with room to grow.",
    "today page",
  );
  assert.equal((await exportState()).state.learners.length, 6);
  await click(".skip-link");
  assert.equal(await page.eval(() => document.activeElement.id), "main");
  assert.equal(await page.eval(() => location.hash), "#/today");
  mark(
    "separate workspace opens with six fictional learners and a working skip link",
  );
  await route("studio");
  assert.equal(
    await page.eval(
      () =>
        document.querySelectorAll("select,input[type=date],input[type=time]")
          .length,
    ),
    0,
  );
  await click('[aria-label="Activity"]');
  assert.equal(
    await page.eval(
      () => document.querySelector("[role=listbox]:not([hidden])") !== null,
    ),
    true,
  );
  await page.screenshot({ path: join(out, "desktop-choice-open.jpg") });
  await page.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "ArrowDown",
    code: "ArrowDown",
    windowsVirtualKeyCode: 40,
  });
  assert.equal(
    await page.eval(() => document.activeElement?.getAttribute("role")),
    "option",
  );
  await page.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
  });
  assert.equal(
    await page.eval(() =>
      document
        .querySelector('[aria-label="Activity"]')
        .getAttribute("aria-expanded"),
    ),
    "false",
  );
  mark("styled choice list opens, supports keyboard movement and closes");
  await fill("[name=title]", "QA morning routines");
  await click("[data-action=route][data-route=Support]");
  assert.equal(
    await page.eval(() => document.querySelector("[name=title]").value),
    "QA morning routines",
  );
  await fill("[name=teacherNotes]", "Private teacher QA note");
  await click("[name=approved]");
  assert.equal(
    await page.eval(
      () =>
        getComputedStyle(document.querySelector("[name=approved]"))
          .backgroundColor,
    ),
    "rgb(40, 76, 59)",
  );
  await submit("lesson");
  await until(
    () =>
      [...document.querySelectorAll(".saved-lesson")].some(
        (el) =>
          el.textContent.includes("QA morning routines") &&
          el.textContent.includes("Teacher approved"),
      ),
    "saved reviewed note",
  );
  mark("editable Support note saves as a teacher-approved version");
  await click("[data-action=preview]");
  await until(
    () => !!document.querySelector("[data-form=practice]"),
    "practice",
  );
  for (const [q, a] of [
    [0, 1],
    [1, 0],
    [2, 1],
  ])
    await click(`[name="q-${q}"][value="${a}"]`);
  await submit("practice");
  assert.match(
    await page.eval(() => document.querySelector(".core-score").textContent),
    /2 of 3/,
  );
  assert.equal(
    await page.eval(
      () => document.querySelectorAll(".answer-feedback.retry").length,
    ),
    1,
  );
  await fill("[name=writing]", "QA response: Does she walk on Mondays?");
  await fill(
    "[name=reasoning]",
    "QA reasoning: After does, use the base form.",
  );
  await click("[data-action=writing-guidance]");
  assert.equal(
    await page.eval(() => document.querySelector("#writing-guidance").hidden),
    false,
  );
  assert.match(
    await page.eval(
      () => document.querySelector("#writing-guidance").textContent,
    ),
    /No automatic writing grade/,
  );
  assert.equal(
    JSON.stringify(await exportState()).includes("QA response:"),
    false,
  );
  mark(
    "core score and feedback work; writing is reviewed and stays out of saved records",
  );
  await page.eval(() => {
    window.print = () => {
      window.__printText =
        document.querySelector(".print-handout")?.textContent;
    };
  });
  await click("[data-action=print-note]");
  const print = await page.eval(() => window.__printText);
  assert.match(print, /Our learning goal/);
  assert.equal(print.includes("Private teacher QA note"), false);
  assert.equal(print.includes("After does, use the base form swim."), false);
  mark("print handout excludes teacher notes and answer feedback");
  await route("learners");
  await click("[data-action=add-learner]");
  await submit("learner");
  assert.match(
    await page.eval(
      () => document.querySelector(".modal .form-error").textContent,
    ),
    /highlighted/,
  );
  await fill(".modal [name=alias]", "QA Robin");
  await fill(".modal [name=school]", "QA Sample Primary");
  await submit("learner");
  await until(() => !document.querySelector(".modal"), "learner save");
  assert.equal((await exportState()).state.learners.length, 7);
  await choose("schoolFilter", "QA Sample Primary");
  assert.equal(
    await page.eval(
      () => document.querySelectorAll(".learner-table tbody tr").length,
    ),
    1,
  );
  mark("styled errors, learner creation and school filter work");
  await route("reflections");
  await fill("[name=evidence]", "QA: used a singular subject accurately.");
  await fill("[name=nextStep]", "QA: transfer to a question with does.");
  await fill("[name=teachingReflection]", "QA: allow more explanation time.");
  await choose("level", "3");
  await fill(
    "[name=challengeEvidence]",
    "QA: explained a transfer question with a model.",
  );
  await fill("[name=bonusMarks]", "2");
  await submit("reflection");
  await until(
    () => !!document.querySelector(".reflection-entry"),
    "reflection save",
  );
  assert.equal((await exportState()).state.learners[0].skills.Grammar, 3);
  assert.equal((await exportState()).state.reflections.at(-1).bonusMarks, 2);
  mark("teacher reflection updates one learner skill with evidence");
  await route("timetable");
  await click("[data-action=add-session]");
  await fill(".modal [name=title]", "QA class conflict");
  await choose("room", "Room A");
  await submit("session");
  await until(
    () => !document.querySelector(".modal .form-error").hidden,
    "booking conflict",
  );
  assert.match(
    await page.eval(
      () => document.querySelector(".modal .form-error").textContent,
    ),
    /changeover/,
  );
  assert.equal(
    await page.eval(() => document.querySelector(".modal [name=title]").value),
    "QA class conflict",
  );
  await fill(".modal [name=title]", "QA evening class");
  await choose("start", "19:00");
  await choose("end", "20:00");
  await choose("room", "Room B");
  await choose("teacher", "Teacher B");
  await click(".modal [name=learnerIds][value=learner-1]");
  await submit("session");
  await until(() => !document.querySelector(".modal"), "class save");
  const session = (await exportState()).state.sessions.find(
    (s) => s.title === "QA evening class",
  );
  assert.ok(session);
  await click(`[data-action=edit-session][data-id="${session.id}"]`);
  await fill(".modal [name=title]", "QA revised class");
  await submit("session-update");
  await until(() => !document.querySelector(".modal"), "class edit");
  assert.equal(
    (await exportState()).state.sessions.find((s) => s.id === session.id).title,
    "QA revised class",
  );
  await click(`[data-action=cancel-session][data-id="${session.id}"]`);
  await click("[data-action=confirm-cancel-session]");
  await until(() => !document.querySelector(".modal"), "class cancel");
  assert.equal(
    (await exportState()).state.sessions.find((s) => s.id === session.id)
      .cancelled,
    true,
  );
  mark(
    "conflicts preserve form input; class creation, editing and cancellation work",
  );
  await route("impact");
  await click("[data-action=add-impact]");
  for (const [name, val] of Object.entries({
    baselineSheets: 10,
    actualSheets: 15,
    baselineMinutes: 30,
    actualMinutes: 20,
    placesOffered: 2,
    placesUsed: 1,
    neighbourIncidents: 1,
  }))
    await fill(`.modal [name=${name}]`, String(val));
  await fill(
    ".modal [name=note]",
    "QA demonstration: matched timer and print log.",
  );
  await submit("impact");
  await until(() => !document.querySelector(".modal"), "impact save");
  const exported = await exportState();
  assert.equal(exported.impact.sheetDifference, -5);
  assert.equal(exported.impact.minuteDifference, 10);
  assert.equal(exported.impact.carbonKg, null);
  assert.equal(exported.impact.outcomeVerified, false);
  mark("impact preserves signed increases, sources and unverified status");
  await page.goto(base + "#/impact");
  await until(
    () => !!document.querySelector(".evidence-list"),
    "persisted impact",
  );
  mark("saved workspace survives a page reload");
  for (const width of [768, 390]) {
    await page.setViewport({ width, height: 844, mobile: width === 390 });
    for (const name of [
      "today",
      "studio",
      "learners",
      "timetable",
      "reflections",
      "impact",
    ]) {
      await route(name);
      assert.equal(
        await page.eval(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
        false,
        `${name} overflows at ${width}`,
      );
    }
    await route("learners");
    await click("[data-action=add-learner]");
    await click('[aria-label="School level"]');
    await page.screenshot({ path: join(out, `choice-open-${width}.jpg`) });
    assert.equal(
      await page.eval(
        () => document.querySelector("[role=listbox]:not([hidden])") !== null,
      ),
      true,
    );
    await page.send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: "Escape",
      code: "Escape",
      windowsVirtualKeyCode: 27,
    });
    await click("[data-action=close-modal]");
    mark(
      `six workspace routes fit at ${width}px and the styled form menu opens`,
    );
  }
  assert.deepEqual(page.consoleErrors, []);
  mark("no browser JavaScript exceptions");
  writeFileSync(
    join(out, "results.json"),
    JSON.stringify(
      { url: base, at: new Date().toISOString(), passed },
      null,
      2,
    ),
  );
  console.log(`${passed.length} browser integration checks passed.`);
} finally {
  // Remove only this script's demonstration workspace. No real learner data is used.
  await page
    .eval(async () => {
      const token = localStorage.getItem("learning-room.workspace.v1");
      if (token) {
        const { API_ORIGIN } = await import("./config.js");
        await fetch(API_ORIGIN + "/api/workspace", {
          method: "DELETE",
          headers: { Authorization: "Bearer " + token },
        });
        localStorage.removeItem("learning-room.workspace.v1");
      }
    })
    .catch(() => {});
  await browser.close();
}
