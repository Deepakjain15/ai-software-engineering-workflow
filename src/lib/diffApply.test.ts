import test from "node:test";
import assert from "node:assert/strict";
import { access, mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { applyFileEdits } from "./diffApply.js";

test("applyFileEdits writes files described in the model's JSON response", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "ai-dev-test-"));
  try {
    const modelText = JSON.stringify({
      summary: "test edit",
      files: [{ path: "nested/hello.txt", content: "hello world" }],
    });

    const { summary, filesWritten } = await applyFileEdits(dir, modelText);

    assert.equal(summary, "test edit");
    assert.deepEqual(filesWritten, ["nested/hello.txt"]);
    const written = await readFile(path.join(dir, "nested/hello.txt"), "utf-8");
    assert.equal(written, "hello world");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

// Layout: <base>/project is the target folder; <base> is outside it.
async function makeProject(): Promise<{ base: string; project: string }> {
  const base = await mkdtemp(path.join(tmpdir(), "ai-dev-safety-"));
  const project = path.join(base, "project");
  await mkdir(project);
  return { base, project };
}

test("applyFileEdits refuses a relative path that escapes the project folder", async () => {
  const { base, project } = await makeProject();
  try {
    const modelText = JSON.stringify({ summary: "x", files: [{ path: "../escape.txt", content: "nope" }] });
    await assert.rejects(() => applyFileEdits(project, modelText), /outside the project/);
    assert.equal(await exists(path.join(base, "escape.txt")), false);
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});

test("applyFileEdits refuses an absolute path", async () => {
  const { base, project } = await makeProject();
  try {
    const target = path.join(base, "absolute.txt");
    const modelText = JSON.stringify({ summary: "x", files: [{ path: target, content: "nope" }] });
    await assert.rejects(() => applyFileEdits(project, modelText), /outside the project/);
    assert.equal(await exists(target), false);
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});

test("applyFileEdits writes nothing when any path in the batch is unsafe", async () => {
  const { base, project } = await makeProject();
  try {
    const modelText = JSON.stringify({
      summary: "x",
      files: [
        { path: "good.txt", content: "fine" },
        { path: "../bad.txt", content: "nope" },
      ],
    });
    await assert.rejects(() => applyFileEdits(project, modelText), /outside the project/);
    assert.equal(await exists(path.join(project, "good.txt")), false);
    assert.equal(await exists(path.join(base, "bad.txt")), false);
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});

test("applyFileEdits still allows a path that stays inside the project", async () => {
  const { base, project } = await makeProject();
  try {
    const modelText = JSON.stringify({ summary: "x", files: [{ path: "./sub/../ok.txt", content: "fine" }] });
    await applyFileEdits(project, modelText);
    assert.equal(await readFile(path.join(project, "ok.txt"), "utf-8"), "fine");
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});

test("applyFileEdits allows a file whose name merely starts with two dots", async () => {
  const { base, project } = await makeProject();
  try {
    const modelText = JSON.stringify({ summary: "x", files: [{ path: "..notes.txt", content: "fine" }] });
    await applyFileEdits(project, modelText);
    assert.equal(await readFile(path.join(project, "..notes.txt"), "utf-8"), "fine");
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});

test("applyFileEdits throws a clear error on invalid JSON instead of silently doing nothing", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "ai-dev-test-"));
  try {
    await assert.rejects(() => applyFileEdits(dir, "not json"), /wasn't valid JSON/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
