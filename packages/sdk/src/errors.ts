/**
 * Thrown by SDK definition classes (BotDefinition, IntegrationDefinition, PluginDefinition, etc.)
 * for intentional validation errors whose message is already clear.
 *
 * The CLI detects this class to suppress the "Offending code:" section that it normally
 * appends to errors thrown during definition file evaluation.
 */
export class DefinitionError extends Error {
  /** @internal Marker used by {@link isDefinitionError} to survive esbuild bundle boundaries. */
  public readonly __IS_SDK_ERROR__ = true as const
  public readonly type = 'definition_error' as const
}

/**
 * Type guard to detect {@link DefinitionError} across esbuild bundle boundaries.
 *
 * Tries `instanceof` first (same bundle), then falls back to the `__IS_SDK_ERROR__` marker
 * and `type` field for cross-bundle cases where esbuild inlines a separate copy of the SDK class.
 */
export const isDefinitionError = (error: unknown): error is DefinitionError =>
  error instanceof DefinitionError ||
  (typeof error === 'object' &&
    error !== null &&
    '__IS_SDK_ERROR__' in error &&
    error.__IS_SDK_ERROR__ === true &&
    'type' in error &&
    error.type === 'definition_error')