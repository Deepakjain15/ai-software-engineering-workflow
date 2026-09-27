import { runProjectTests } from "../lib/runTests.js";

export async function testCommand(targetDir: string): Promise<void> {
  console.log(`[ai-dev] running tests in ${targetDir}`);
  const { passed, output } = await runProjectTests(targetDir);

  console.log(output);
  console.log(passed ? "\n✅ tests passed" : "\n❌ tests failed");

  if (!passed) {
    process.exitCode = 1;
  }
}
