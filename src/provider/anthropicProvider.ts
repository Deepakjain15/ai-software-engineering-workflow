import Anthropic from "@anthropic-ai/sdk";
import type { CallKind, CompletionResult, ModelProvider } from "./types.js";

const DEFAULT_MODEL = "claude-sonnet-4-5";

export class AnthropicProvider implements ModelProvider {
  readonly name = "anthropic";
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string = process.env.AI_DEV_MODEL ?? DEFAULT_MODEL) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async complete(_kind: CallKind, system: string, prompt: string): Promise<CompletionResult> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    return {
      text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }
}
