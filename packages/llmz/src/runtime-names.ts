/** Runtime bindings are never tool names or retained user variables. */
export const RUNTIME_BINDING_NAMES = ['$return', '$iterations', 'exit', 'inspect', 'chat'] as const

export const TERMINATION_BINDING_NAMES = ['__llmz_guard', '__llmz_checkpoint', '__llmz_missing_tool'] as const

export const RESERVED_RUNTIME_NAMES: ReadonlySet<string> = new Set([
  ...RUNTIME_BINDING_NAMES,
  ...TERMINATION_BINDING_NAMES,
])
