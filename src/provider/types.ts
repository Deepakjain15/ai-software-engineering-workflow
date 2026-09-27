export interface CompletionUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface CompletionResult {
  text: string;
  usage: CompletionUsage;
}

export type CallKind = "plan" | "implement" | "review" | "fix";

export interface ModelProvider {
  readonly name: string;
  complete(kind: CallKind, system: string, prompt: string): Promise<CompletionResult>;
}
