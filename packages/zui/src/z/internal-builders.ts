import type { ZodBuilders } from './typings'

/**
 * Just like builders, but with no depencies on the Zod types implementations.
 * This allows us to break the circular dependency between builders and types.
 * Types can then import the internal builders to build other types.
 *
 * Check out this mermaid diagram for a visual representation of the dependencies:
 *
 * ```mermaid
 * flowchart LR
 *       Typings["typings.ts"]
 *       Internals["internal-builders.ts"]
 *       Types["types/*"]
 *       Builders["builders.ts"]
 *
 *       Builders --> Types
 *       Builders --> Typings
 *       Types --> Internals
 *       Builders --> Internals
 *       Builders --> Typings
 *       Types --> Typings
 *       Internals --> Typings
 * ```
 */
export const builders = {} as ZodBuilders

export function setBuilders(b: ZodBuilders): void {
  Object.assign(builders, b)
}
