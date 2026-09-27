import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { CallKind, CompletionResult, ModelProvider } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.resolve(__dirname, "../../fixtures");

interface Fixture {
  text: string;
  usage: { inputTokens: number; outputTokens: number };
}

/**
 * Returns recorded, deterministic responses instead of calling a real model.
 * Used automatically when ANTHROPIC_API_KEY isn't set, so the CLI is fully
 * runnable (and demoable) with zero external dependencies or cost.
 */
export class FixtureProvider implements ModelProvider {
  readonly name = "fixture (offline demo mode)";

  async complete(kind: CallKind, _system: string, _prompt: string): Promise<CompletionResult> {
    const raw = await readFile(path.join(FIXTURES_DIR, `${kind}.json`), "utf-8");
    const fixture = JSON.parse(raw) as Fixture;
    return { text: fixture.text, usage: fixture.usage };
  }
}
