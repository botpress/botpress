import { validateGeneratedCode } from './compiler/validate.js'
import { Context, type Iteration } from './context.js'
import { createJoinedAbortController } from './abort-signal.js'
import { BAIL_END_TOKEN, BAIL_START_TOKEN, OneShotPrompt } from './prompts/one-shot.js'
import { generateCode as generateIterationCode } from './runtime/generate.js'
import { type ExecutionHooks, type ExecutionProps, type RuntimeCognitive } from './runtime/types.js'
import { initCognitiveClient as createCognitiveClient } from './runtime/utils.js'
import { init } from './utils.js'

/**
 * Number of times {@link generateCode} will ask the LLM to fix code that fails
 * validation before giving up (in addition to the initial generation).
 */
const MAX_FIX_ATTEMPTS = 3

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
  | 'client'
  | 'chat'
  | 'instructions'
  | 'tools'
  | 'objects'
  | 'exits'
  | 'model'
  | 'temperature'
  | 'reasoningEffort'
  | 'snapshot'
  | 'signal'
  | 'onTrace'
>

/**
 * Result of {@link generateCode}:
 * - `success`: valid code was generated.
 * - `bailed`: the LLM decided the task cannot be accomplished (e.g. a required tool
 *   is missing) and returned a reason instead of code.
 * - `invalid`: the LLM produced code but it still failed validation after all fix
 *   attempts; the last attempt's code and the outstanding validation errors are returned.
 */
export type GenerateCodeResult =
  | { status: 'success'; code: string }
  | { status: 'bailed'; reason: string }
  | { status: 'invalid'; code: string; errors: string[] }

/**
 * Extracts a bail reason from the raw LLM output, or `null` if the LLM did not
 * bail. The LLM bails (instead of generating code) when it cannot accomplish the
 * task correctly — e.g. a required tool is missing. See `one-shot/system.md`.
 */
function parseBail(rawOutput: string): string | null {
  const startIndex = rawOutput.indexOf(BAIL_START_TOKEN)
  if (startIndex === -1) {
    return null
  }

  const reasonStart = startIndex + BAIL_START_TOKEN.length
  const endIndex = rawOutput.indexOf(BAIL_END_TOKEN, reasonStart)
  const reason = rawOutput.slice(reasonStart, endIndex === -1 ? undefined : endIndex).trim()

  return reason.length ? reason : 'The task cannot be accomplished with the available tools.'
}

/**
 * Formats validation errors into a message the LLM can act on when asked to fix
 * its previous code.
 */
function formatValidationErrors(errors: string[]): string {
  return `The code you generated failed validation and cannot be used as-is:\n${errors
    .map((error) => `- ${error}`)
    .join('\n')}\n\nPlease fix these issues and regenerate the complete code.`
}

/**
 * Runs a single LLM generation into a fresh iteration, forwarding traces.
 */
async function generateIteration({
  ctx,
  cognitive,
  controller,
  onTrace,
}: {
  ctx: Context
  cognitive: RuntimeCognitive
  controller: AbortController
  onTrace?: ExecutionHooks['onTrace']
}): Promise<Iteration> {
  const iteration = await ctx.nextIteration()

  const unsubscribeTrace = iteration.traces.onPush((traces) => {
    for (const trace of traces) {
      onTrace?.({ trace, iteration: ctx.iterations.length })
    }
  })

  try {
    await generateIterationCode({ iteration, ctx, cognitive, controller })
    return iteration
  } finally {
    try {
      unsubscribeTrace()
    } catch (err: unknown) {
      void err
      // Best-effort cleanup; trace subscribers should not affect generation.
    }
  }
}

/**
 * Generates a block of TypeScript code from the LLM based on the given generation
 * inputs, validating it and retrying on failure.
 *
 * Unlike {@link execute}, this does NOT run the generated code or execute any tools.
 * It performs one LLM call, then validates the result (does it compile? does it only
 * reference tools/objects/variables that exist?). If validation fails, it asks the
 * LLM to fix the code up to {@link MAX_FIX_ATTEMPTS} times, feeding the validation
 * errors back through the normal invalid-code recovery prompt.
 *
 * Outcomes:
 * - `{ status: 'success', code }` — valid code was produced.
 * - `{ status: 'bailed', reason }` — the LLM determined the task cannot be
 *   accomplished with the available tools and returned a reason instead of code.
 * - `{ status: 'invalid', code, errors }` — code was produced but never passed
 *   validation within the retry budget; the last attempt and its errors are returned.
 */
export async function generateCode(props: GenerateCodeProps): Promise<GenerateCodeResult> {
  await init()

  const controller = createJoinedAbortController([props.signal])

  const cognitive = createCognitiveClient(props.client)

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
    // Allow the initial generation plus up to MAX_FIX_ATTEMPTS validation retries.
    loop: MAX_FIX_ATTEMPTS + 1,
  })

  // Use the one-shot prompt: no iterations, no mid-execution thinking, no restarts.
  ctx.version = OneShotPrompt

  let lastInvalid: { code: string; errors: string[] } | null = null

  for (let attempt = 0; attempt <= MAX_FIX_ATTEMPTS; attempt++) {
    const iteration = await generateIteration({ ctx, cognitive, controller, onTrace: props.onTrace })

    // The LLM may bail instead of generating code when the task cannot be done
    // correctly with the available tools. The bail is emitted in the raw output.
    const reason = parseBail(iteration.llm?.output ?? '')
    if (reason !== null) {
      return { status: 'bailed', reason }
    }

    const code = iteration.code ?? ''
    const validation = validateGeneratedCode(code, { tools: iteration.tools, objects: iteration.objects })
    if (validation.valid) {
      return { status: 'success', code }
    }

    lastInvalid = { code, errors: validation.errors }

    // Feed the validation failure back so the next iteration regenerates a fix,
    // reusing the normal invalid-code recovery prompt (which shows the LLM its
    // previous code plus the errors).
    if (attempt < MAX_FIX_ATTEMPTS) {
      iteration.end({
        type: 'invalid_code_error',
        invalid_code_error: { message: formatValidationErrors(validation.errors) },
      })
    }
  }

  return {
    status: 'invalid',
    code: lastInvalid?.code ?? '',
    errors: lastInvalid?.errors ?? [],
  }
}
