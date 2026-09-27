import { getProvider } from "../provider/index.js";
import { getGitDiff } from "../lib/gitDiff.js";
import { applyFileEdits } from "../lib/diffApply.js";
import { CostTracker } from "../lib/costTracker.js";

const SYSTEM_PROMPT = `You are addressing review feedback on a code change.
Respond with ONLY JSON, no markdown fences, matching this shape:
{ "summary": string, "files": [ { "path": string, "content": string } ] }
"content" is the FULL new file content for each file that needs to change.`;

export async function fixCommand(targetDir: string, reviewNotes: string): Promise<void> {
  const provider = getProvider();
  const tracker = new CostTracker();

  const diff = await getGitDiff(targetDir);

  console.log(`[ai-dev] applying fixes with provider: ${provider.name}`);
  const result = await provider.complete(
    "fix",
    SYSTEM_PROMPT,
    `Current diff:\n${diff}\n\nReview feedback to address:\n${reviewNotes}`
  );
  tracker.record("fix", result.usage);

  const { summary, filesWritten } = await applyFileEdits(targetDir, result.text);

  console.log(`\n${summary}\n`);
  console.log("Files written:");
  for (const file of filesWritten) console.log(`  - ${file}`);
  console.log(`\n${tracker.summary()}`);
}
