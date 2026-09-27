import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function getGitDiff(targetDir: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", ["diff", "--no-color"], { cwd: targetDir });
    return stdout.trim();
  } catch (error) {
    throw new Error(
      `Couldn't read "git diff" in ${targetDir}. Is it a git repository?\n${(error as Error).message}`
    );
  }
}
