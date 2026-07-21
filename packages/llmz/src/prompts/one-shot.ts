import { buildSystemMessage, DualModePrompt } from './dual-modes.js'
import ONE_SHOT_SYSTEM_PROMPT_TEXT from './one-shot/system.md.js'
import { Prompt } from './prompt.js'

/**
 * Tokens delimiting a "bail" reply, emitted by the LLM (instead of a code block)
 * when it cannot generate correct code for the task — e.g. a required tool is
 * missing. Must match the format documented in `one-shot/system.md`.
 */
export const BAIL_START_TOKEN = '■bail_start'
export const BAIL_END_TOKEN = '■bail_end'

/**
 * Prompt used for one-shot code generation.
 *
 * It reuses the dual-mode prompt for everything except the system message, which
 * is replaced with a one-shot variant that tells the LLM there are no iterations,
 * no mid-execution thinking, and no restarts — the code must be complete and
 * correct on the first and only try. It may also "bail" (see the bail tokens
 * above) when the task cannot be accomplished with the available tools.
 */
export const OneShotPrompt: Prompt = {
  ...DualModePrompt,
  getSystemMessage: (props) => buildSystemMessage(props, ONE_SHOT_SYSTEM_PROMPT_TEXT),
  getStopTokens: () => [...DualModePrompt.getStopTokens(), BAIL_END_TOKEN],
}
