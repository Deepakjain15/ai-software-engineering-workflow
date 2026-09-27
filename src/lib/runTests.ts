import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface TestRunResult {
  passed: boolean;
  output: string;
}

export async function runProjectTests(targetDir: string): Promise<TestRunResult> {
  try {
    const { stdout, stderr } = await execFileAsync("npm", ["test", "--silent"], {
      cwd: targetDir,
      shell: process.platform === "win32",
    });
    return { passed: true, output: [stdout, stderr].filter(Boolean).join("\n") };
  } catch (error) {
    const execError = error as { stdout?: string; stderr?: string; message: string };
    const output = [execError.stdout, execError.stderr].filter(Boolean).join("\n") || execError.message;
    return { passed: false, output };
  }
}
