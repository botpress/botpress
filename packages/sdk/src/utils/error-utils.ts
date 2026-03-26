/**
 * Utility to throw an error in ternary or nullish coalescing expressions
 */
export const throwError = (thrown: string | Error): never => {
  const error = thrown instanceof Error ? thrown : new Error(thrown)
  throw error
}

/**
 * Thrown by SDK definition classes (BotDefinition, IntegrationDefinition, PluginDefinition, etc.)
 * for intentional validation errors whose message is already clear.
 *
 * The CLI detects this class to suppress the "Offending code:" section that it normally
 * appends to errors thrown during definition file evaluation.
 */
export class DefinitionError extends Error {
  // Marker property used by isDefinitionError() to identify this error type across
  // esbuild bundle boundaries, where `instanceof` checks are unreliable.
  public readonly isDefinitionError = true as const
}

/**
 * Type guard to detect {@link DefinitionError} across esbuild bundle boundaries.
 *
 * **Why not `instanceof`?**
 * When the CLI reads a definition file, esbuild compiles it with `bundle: true`, which
 * inlines the full `@botpress/sdk` source into the artifact. The SDK class inside that
 * bundle is a different object in memory than the CLI's own `require('@botpress/sdk')`
 * import, so `thrown instanceof DefinitionError` always returns `false`.
 * We therefore rely on a marker property that survives the bundle boundary.
 */
export const isDefinitionError = (error: unknown): error is DefinitionError =>
  typeof error === 'object' && error !== null && (error as any).isDefinitionError === true
