import type { CompletionUsage } from "../provider/types.js";

/**
 * Token/cost tracking, kept deliberately simple: prices aren't hardcoded
 * (list prices change and vary by model), so cost is only shown when the
 * caller sets both rate env vars. Otherwise we still report token counts,
 * which is the part that's always true regardless of current pricing.
 */
export interface UsageEntry extends CompletionUsage {
  kind: string;
}

export class CostTracker {
  private entries: UsageEntry[] = [];

  record(kind: string, usage: CompletionUsage): void {
    this.entries.push({ kind, ...usage });
  }

  summary(): string {
    const totalIn = this.entries.reduce((sum, entry) => sum + entry.inputTokens, 0);
    const totalOut = this.entries.reduce((sum, entry) => sum + entry.outputTokens, 0);

    const lines = [`Tokens used — input: ${totalIn}, output: ${totalOut}`];

    const inRate = Number(process.env.AI_DEV_INPUT_PRICE_PER_MTOK);
    const outRate = Number(process.env.AI_DEV_OUTPUT_PRICE_PER_MTOK);
    if (Number.isFinite(inRate) && Number.isFinite(outRate)) {
      const cost = (totalIn / 1_000_000) * inRate + (totalOut / 1_000_000) * outRate;
      lines.push(`Estimated cost: $${cost.toFixed(4)} (using configured per-MTok rates)`);
    } else {
      lines.push(
        "Set AI_DEV_INPUT_PRICE_PER_MTOK / AI_DEV_OUTPUT_PRICE_PER_MTOK to also see estimated $ cost."
      );
    }

    return lines.join("\n");
  }
}
