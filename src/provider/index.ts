import { AnthropicProvider } from "./anthropicProvider.js";
import { FixtureProvider } from "./fixtureProvider.js";
import type { ModelProvider } from "./types.js";

export function getProvider(): ModelProvider {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    return new AnthropicProvider(apiKey);
  }
  return new FixtureProvider();
}

export * from "./types.js";
