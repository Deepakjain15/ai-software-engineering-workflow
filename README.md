# ai-dev — an AI-assisted SDLC CLI

A small CLI that walks a coding task through **plan → implement → test → review → fix**, calling Claude for each step. If no API key is set, it falls back to recorded fixture responses so the whole workflow is runnable and demoable with zero cost or external dependency — same code path either way, just a different `ModelProvider`.

This isn't a wrapper around "send my code to an LLM and hope." It's a small, honest example of the actual engineering questions that come up when you put an LLM in a development loop: how do you make its output reliably machine-parseable (not just readable), how do you keep a demo runnable without burning API credits on every test, and how do you track what it's costing you.

## Demo

```bash
npm install
npm run build

# 1. Plan a fix for the intentionally-buggy demo project
node dist/cli.js plan "Fix the cart discount bug"

# 2. Apply the plan
node dist/cli.js implement

# 3. Confirm it actually works
node dist/cli.js test
# ✅ tests passed

# 4. Review the change
node dist/cli.js review

# 5. Address review feedback
node dist/cli.js fix "clamp discountPercent to a max of 100 and use ?? instead of a falsy check"
```

By default this runs in **offline demo mode** — no `ANTHROPIC_API_KEY` needed. Set one (see `.env.example`) and it calls the real Claude API instead, with the exact same commands.

## The demo project

`demo-project/` is a tiny standalone Node project with one real, intentional bug: `calculateTotal` in `src/cart.js` ignores each item's `discountPercent`. `test/cart.test.js` fails against the unmodified file — you can verify that yourself with `cd demo-project && npm test` before running anything else. `ai-dev implement` is what actually fixes it.

## Why fixtures, not just a live API call

An MVP that only works when you have a paid API key isn't actually demoable — for a reviewer, a recruiter, or CI. So every command routes through a `ModelProvider` interface (`src/provider/types.ts`) with two implementations:

- `AnthropicProvider` — real calls via `@anthropic-ai/sdk`, used automatically when `ANTHROPIC_API_KEY` is set.
- `FixtureProvider` — returns recorded, deterministic JSON from `fixtures/*.json`, used otherwise.

The commands (`plan`, `implement`, `review`, `fix`) don't know or care which one they're talking to. This is also just a genuinely useful pattern for LLM-backed tools generally: it makes CI runnable without API cost, and makes the "does the plumbing actually work" question answerable independently of "is the model's output good."

## Design decisions

- **Full file contents over diffs.** `implement`/`fix` ask the model to return `{ summary, files: [{ path, content }] }` — complete new file contents, not a unified diff. An LLM producing a byte-perfect patch is a much harder and more fragile ask than producing a full file; for an MVP, reliability beat the (real) downside of larger prompts/responses on bigger files.
- **Token/cost tracking without hardcoded prices.** `CostTracker` always reports token counts (input/output) per call. It only computes a dollar estimate if you set `AI_DEV_INPUT_PRICE_PER_MTOK`/`AI_DEV_OUTPUT_PRICE_PER_MTOK` yourself — model pricing changes and varies by tier, so a hardcoded number would eventually just be wrong.
- **Plan as a file, not just stdout.** `plan` writes `PLAN.md` into the target project. It's the one artifact meant to be read/edited by a human before `implement` acts on it — closer to how you'd actually want a human-in-the-loop AI workflow to behave than a single opaque command.

## What I'd add next

- A real diff-based implement mode for large files, where returning full contents gets expensive.
- A `--dry-run` for `implement`/`fix` that shows the intended file changes without writing them.
- Retry/backoff and a max-turns budget around the real Anthropic calls (currently a single request per command, no retry logic).

## Project structure

```
src/
  cli.ts                 entry point (commander)
  commands/               plan / implement / test / review / fix
  provider/               ModelProvider interface + Anthropic/Fixture implementations
  lib/                    plan file I/O, file-edit application, git diff, test runner, cost tracker
demo-project/             tiny sample app with one real bug, used by the demo above
fixtures/                 recorded model responses used in offline demo mode
```

## Setup

```bash
npm install
cp .env.example .env   # optional — only needed to use a real API key
npm run build
npm test                # unit tests — run entirely offline, no API key needed
```
