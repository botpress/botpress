import { createJoinedAbortController } from "../abort-signal.js";
import { Context } from "../context.js";
import { BAIL_END_TOKEN, BAIL_START_TOKEN, OneShotPrompt } from "../prompts/one-shot.js";
import { generateCode as generateIterationCode } from "../runtime/generate.js";
import { type ExecutionProps } from "../runtime/types.js";
import { initCognitiveClient as createCognitiveClient } from "../runtime/utils.js";
import { init } from "../utils.js";

/**
 * Props for generating code from an LLM.
 *
 * Only the props from {@link ExecutionProps} that shape or drive code generation
 * are kept (instructions, tools, objects, exits, chat, model settings, etc.).
 * Everything specific to running the generated code (tool hooks, the iteration
 * loop, exit handling, execution options) is omitted since no code is executed.
 */
export type GenerateCodeProps = Pick<
  ExecutionProps,
  | "client"
  | "chat"
  | "instructions"
  | "tools"
  | "objects"
  | "exits"
  | "model"
  | "temperature"
  | "reasoningEffort"
  | "snapshot"
  | "signal"
  | "onTrace"
>;

/**
 * Result of {@link generateCode}: either the generated code, or a bail with the
 * reason the LLM could not produce correct code for the task.
 */
export type GenerateCodeResult =
  | { status: "success"; code: string }
  | { status: "bailed"; reason: string };

/**
 * Extracts a bail reason from the raw LLM output, or `null` if the LLM did not
 * bail. The LLM bails (instead of generating code) when it cannot accomplish the
 * task correctly — e.g. a required tool is missing. See `one-shot/system.md`.
 */
function parseBail(rawOutput: string): string | null {
  const startIndex = rawOutput.indexOf(BAIL_START_TOKEN);
  if (startIndex === -1) {
    return null;
  }

  const reasonStart = startIndex + BAIL_START_TOKEN.length;
  const endIndex = rawOutput.indexOf(BAIL_END_TOKEN, reasonStart);
  const reason = rawOutput
    .slice(reasonStart, endIndex === -1 ? undefined : endIndex)
    .trim();

  return reason.length ? reason : "The task cannot be accomplished with the available tools.";
}

/**
 * Generates a single block of TypeScript code from the LLM based on the given
 * generation inputs.
 *
 * Unlike {@link execute}, this does NOT run the generated code, execute any
 * tools, or iterate — it performs exactly one LLM call.
 *
 * If the LLM determines the task cannot be accomplished correctly with the
 * available tools (e.g. a required tool is missing), it bails instead of
 * producing subpar code, and the result is `{ status: 'bailed', reason }`.
 * Otherwise the result is `{ status: 'success', code }`.
 */
export async function generateCode(props: GenerateCodeProps): Promise<GenerateCodeResult> {
  await init();

  const controller = createJoinedAbortController([props.signal]);

  const cognitive = createCognitiveClient(props.client);

  const ctx = new Context({
    chat: props.chat,
    instructions: props.instructions,
    objects: props.objects,
    tools: props.tools,
    exits: props.exits,
    snapshot: props.snapshot,
    model: props.model,
    temperature: props.temperature,
    reasoningEffort: props.reasoningEffort,
  });

  // Use the one-shot prompt: no iterations, no mid-execution thinking, no restarts.
  ctx.version = OneShotPrompt;

  const iteration = await ctx.nextIteration();

  const unsubscribeTrace = iteration.traces.onPush((traces) => {
    for (const trace of traces) {
      props.onTrace?.({ trace, iteration: ctx.iterations.length });
    }
  });

  try {
    await generateIterationCode({ iteration, ctx, cognitive, controller });

    // The LLM may bail instead of generating code when the task cannot be done
    // correctly with the available tools. The bail is emitted in the raw output.
    const reason = parseBail(iteration.llm?.output ?? "");
    if (reason !== null) {
      return { status: "bailed", reason };
    }

    return { status: "success", code: iteration.code ?? "" };
  } finally {
    try {
      unsubscribeTrace();
    } catch (err: unknown) {
      void err;
      // Best-effort cleanup; trace subscribers should not affect generation.
    }
  }
}
