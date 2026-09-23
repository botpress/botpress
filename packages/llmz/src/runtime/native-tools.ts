import type { CognitiveTool, CognitiveToolCall } from '@botpress/cognitive'

export const WORKER_RESPONSE_INSTRUCTION =
  'You are running in worker mode. Respond only with a run_javascript tool call. Keep assistant text empty: do not send messages, preambles, progress updates, explanations, acknowledgements such as "Done", Markdown, or JSON outside the tool call. This applies before and after tools, during recovery, and when completing the task.'

const EXECUTION_DESCRIPTION =
  'Execute a JavaScript program in the sandbox. This is the only native tool; business functions are called INSIDE its code, using their documented signatures. It is not a search engine: never submit search terms, user questions, answers, or business tool names as code. Await business calls, then return inspect(value) to read their results, or return exit(name, payload) to select a registered outcome. See "run_javascript syntax" and the examples.'

export const RUN_JAVASCRIPT_TOOL: CognitiveTool = {
  name: 'run_javascript',
  description: `${EXECUTION_DESCRIPTION} For a requested text message plus an action or component, include the assistant text AND this tool call in the same response. A plain assistant reply needs no tool call when no action remains.`,
  parameters: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        // Qwen/Groq emits prose as code when this schema includes minLength.
        // validateNativeToolCalls enforces non-empty JavaScript before dispatch.
        description: [
          'The body of an async JavaScript program. Top-level await and return are supported. No Markdown fences, XML wrappers, imports, or TypeScript annotations.',
          'Call business functions using the actual API declarations. A string parameter takes a string; an object parameter takes its documented fields. Do not put a query or reply here instead of a program.',
          '<example purpose="JavaScript syntax only">const total = 17 + 25; return inspect(total);</example>',
          'The example tags are documentation only. The code value must contain only executable JavaScript. End with return inspect(value), or return exit("registered_name", payload) with the actual outcome name and required payload. These are JavaScript functions, not separate native tools.',
        ].join('\n\n'),
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
    description: `${WORKER_RESPONSE_INSTRUCTION} ${EXECUTION_DESCRIPTION}`,
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
