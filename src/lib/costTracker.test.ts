import test from "node:test";
import assert from "node:assert/strict";
import { CostTracker } from "./costTracker.js";

test("summary reports total input/output tokens across recorded calls", () => {
  const tracker = new CostTracker();
  tracker.record("plan", { inputTokens: 100, outputTokens: 50 });
  tracker.record("implement", { inputTokens: 200, outputTokens: 75 });

  const summary = tracker.summary();
  assert.match(summary, /input: 300/);
  assert.match(summary, /output: 125/);
});

test("summary omits a dollar estimate when pricing env vars aren't set", () => {
  delete process.env.AI_DEV_INPUT_PRICE_PER_MTOK;
  delete process.env.AI_DEV_OUTPUT_PRICE_PER_MTOK;

  const tracker = new CostTracker();
  tracker.record("plan", { inputTokens: 10, outputTokens: 10 });

  assert.match(tracker.summary(), /Set AI_DEV_INPUT_PRICE_PER_MTOK/);
});
