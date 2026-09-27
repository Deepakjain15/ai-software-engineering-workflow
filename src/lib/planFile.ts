import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const PLAN_FILENAME = "PLAN.md";

export function planPath(targetDir: string): string {
  return path.join(targetDir, PLAN_FILENAME);
}

export async function writePlan(targetDir: string, content: string): Promise<void> {
  await writeFile(planPath(targetDir), content, "utf-8");
}

export async function readPlan(targetDir: string): Promise<string> {
  try {
    return await readFile(planPath(targetDir), "utf-8");
  } catch {
    throw new Error(
      `No ${PLAN_FILENAME} found in ${targetDir}. Run "ai-dev plan <task>" first.`
    );
  }
}
