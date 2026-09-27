import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
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

test("applyFileEdits throws a clear error on invalid JSON instead of silently doing nothing", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "ai-dev-test-"));
  try {
    await assert.rejects(() => applyFileEdits(dir, "not json"), /wasn't valid JSON/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
