/** Supplement explicit reasoning disablement consistently across providers and fallbacks. */
export function getReasoningHint(reasoningEffort?: string): string | undefined {
  return reasoningEffort === 'none' ? '/no_think' : undefined
}
