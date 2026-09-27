#!/usr/bin/env node
import "dotenv/config";
import { Command } from "commander";
import path from "node:path";
import { planCommand } from "./commands/plan.js";
import { implementCommand } from "./commands/implement.js";
import { testCommand } from "./commands/test.js";
import { reviewCommand } from "./commands/review.js";
import { fixCommand } from "./commands/fix.js";

const program = new Command();

program
  .name("ai-dev")
  .description(
    "Walks a coding task through plan -> implement -> test -> review -> fix.\n" +
      "Uses Claude when ANTHROPIC_API_KEY is set, and recorded fixtures otherwise (offline demo mode)."
  )
  .option("-d, --dir <path>", "target project directory", "demo-project")
  .version("0.1.0");

function resolveDir(dir: string): string {
  return path.resolve(process.cwd(), dir);
}

program
  .command("plan <task...>")
  .description("Break a task into a short implementation plan, written to PLAN.md")
  .action(async (taskParts: string[]) => {
    const task = taskParts.join(" ");
    await planCommand(task, resolveDir(program.opts().dir));
  });

program
  .command("implement")
  .description("Apply PLAN.md's steps to the target project")
  .action(async () => {
    await implementCommand(resolveDir(program.opts().dir));
  });

program
  .command("test")
  .description("Run the target project's test suite")
  .action(async () => {
    await testCommand(resolveDir(program.opts().dir));
  });

program
  .command("review")
  .description("Review the current git diff in the target project")
  .action(async () => {
    await reviewCommand(resolveDir(program.opts().dir));
  });

program
  .command("fix <notes...>")
  .description("Address review feedback and apply the resulting changes")
  .action(async (notesParts: string[]) => {
    const notes = notesParts.join(" ");
    await fixCommand(resolveDir(program.opts().dir), notes);
  });

program.parseAsync(process.argv);
