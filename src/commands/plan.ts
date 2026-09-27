import { getProvider } from "../provider/index.js";
import { writePlan } from "../lib/planFile.js";
import { CostTracker } from "../lib/costTracker.js";

const SYSTEM_PROMPT = `You are a senior software engineer breaking a coding task into a short, concrete implementation plan.
Respond in Markdown with: a one-paragraph problem statement, a numbered list of steps, and an "Acceptance criteria" section.
Keep it short enough to actually follow — 3-6 steps, not a design document.`;

export async function planCommand(task: string, targetDir: string): Promise<void> {
  const provider = getProvider();
  const tracker = new CostTracker();

  console.log(`[ai-dev] planning with provider: ${provider.name}`);
  const result = await provider.complete("plan", SYSTEM_PROMPT, `Task: ${task}`);
  tracker.record("plan", result.usage);

  await writePlan(targetDir, result.text);

  console.log(`\nWrote PLAN.md to ${targetDir}\n`);
  console.log(result.text);
  console.log(`\n${tracker.summary()}`);
}
