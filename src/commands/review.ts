import { getProvider } from "../provider/index.js";
import { getGitDiff } from "../lib/gitDiff.js";
import { CostTracker } from "../lib/costTracker.js";

const SYSTEM_PROMPT = `You are reviewing a code change for correctness bugs and missed edge cases.
Be specific and concrete: name the exact function/condition, and describe a real input that would break it.
Skip style nitpicks. If the diff looks correct, say so plainly instead of inventing issues.`;

export async function reviewCommand(targetDir: string): Promise<void> {
  const provider = getProvider();
  const tracker = new CostTracker();

  const diff = await getGitDiff(targetDir);
  if (!diff) {
    console.log("No changes to review (git diff is empty).");
    return;
  }

  console.log(`[ai-dev] reviewing with provider: ${provider.name}`);
  const result = await provider.complete("review", SYSTEM_PROMPT, `Diff:\n${diff}`);
  tracker.record("review", result.usage);

  console.log(`\n${result.text}\n`);
  console.log(tracker.summary());
}
