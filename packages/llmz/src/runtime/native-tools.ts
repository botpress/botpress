import type { CognitiveTool, CognitiveToolCall } from '@botpress/cognitive'

export const WORKER_RESPONSE_INSTRUCTION =
  'You are running in worker mode. Respond only with a run_javascript tool call. Keep assistant text empty: do not send messages, preambles, progress updates, explanations, acknowledgements such as "Done", Markdown, or JSON outside the tool call. This applies before and after tools, during recovery, and when completing the task.'

export const RUN_JAVASCRIPT_TOOL: CognitiveTool = {
  name: 'run_javascript',
  description:
    'Run business tools, send requested chat components, or finish a worker task by executing JavaScript. For text plus actions, write the requested text as a preamble to this tool call; do not end with a text-only answer before the actions. Exact requested text needs no separator before this call: do not append a space or newline to the preamble. An ordinary chat reply with no remaining action needs no tool call just to finish the turn. Code displayed in an answer is text, not a program to execute. See "run_javascript syntax" and the documented functions and memory.',
  parameters: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        minLength: 1,
        description: 'JavaScript source with an explicit return statement. Top-level await is supported.',
      },
    },
    required: ['code'],
    additionalProperties: false,
  },
}

/** Select delivery guidance without changing the native tool name or input schema. */
export function getRunJavaScriptTool(chat: boolean): CognitiveTool {
  if (chat) {
    return RUN_JAVASCRIPT_TOOL
  }

  return {
    ...RUN_JAVASCRIPT_TOOL,
    description: `${WORKER_RESPONSE_INSTRUCTION} See "run_javascript syntax" and the documented functions and memory.`,
  }
}

export type ValidatedNativeCall = {
  id: string
  code: string
}

export type NativeCallValidation = { valid: true; call?: ValidatedNativeCall } | { valid: false; errors: string[] }

/** Validate the entire response before any delivery or business action begins. */
export function validateNativeToolCalls(calls: readonly CognitiveToolCall[]): NativeCallValidation {
  if (!calls.length) {
    return { valid: true }
  }

  if (calls.length > 1) {
    return {
      valid: false,
      errors: ['Use at most one run_javascript call per response. Put all operations inside its JavaScript program.'],
    }
  }

  const [call] = calls

  if (!call || typeof call.id !== 'string' || !call.id.trim()) {
    return { valid: false, errors: ['Every native tool call requires a non-empty ID.'] }
  }

  if (call.name !== RUN_JAVASCRIPT_TOOL.name) {
    return { valid: false, errors: [`Unknown native tool ${JSON.stringify(call.name)}. Use run_javascript.`] }
  }

  const input = call.input

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { valid: false, errors: ['Tool arguments must be a JSON object.'] }
  }

  if (Object.keys(input).some((key) => key !== 'code') || typeof input.code !== 'string' || !input.code.trim()) {
    return { valid: false, errors: ['run_javascript requires exactly one non-empty code string.'] }
  }

  return { valid: true, call: { id: call.id, code: input.code } }
}
