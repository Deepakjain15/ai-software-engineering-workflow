import { getProvider } from "../provider/index.js";
import { readPlan } from "../lib/planFile.js";
import { applyFileEdits } from "../lib/diffApply.js";
import { CostTracker } from "../lib/costTracker.js";

const SYSTEM_PROMPT = `You are a software engineer implementing a plan against an existing project.
Respond with ONLY JSON, no markdown fences, matching this shape:
{ "summary": string, "files": [ { "path": string, "content": string } ] }
"path" is relative to the project root. "content" is the FULL new file content, not a diff.
Only include files that need to change.`;

export async function implementCommand(targetDir: string): Promise<void> {
  const provider = getProvider();
  const tracker = new CostTracker();

  const plan = await readPlan(targetDir);
  console.log(`[ai-dev] implementing with provider: ${provider.name}`);

  const result = await provider.complete(
    "implement",
    SYSTEM_PROMPT,
    `Plan:\n${plan}\n\nImplement the steps above against the project at ${targetDir}.`
  );
  tracker.record("implement", result.usage);

  const { summary, filesWritten } = await applyFileEdits(targetDir, result.text);

  console.log(`\n${summary}\n`);
  console.log("Files written:");
  for (const file of filesWritten) console.log(`  - ${file}`);
  console.log(`\n${tracker.summary()}`);
}
