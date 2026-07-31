import { defineProject as genericDefineProject } from '@botpress-private/dab'
import type { ProjectConfig } from '@botpress-private/dab'
import type { SyncedProjectContext } from './types.js'

type ExpectedConfig = ProjectConfig<'web-app'>

// Type helper to check for excess properties
type ExactConfig<T extends ExpectedConfig> = Exclude<keyof T, keyof ExpectedConfig> extends never
  ? T
  : { ERROR: 'Unexpected properties'; got: Exclude<keyof T, keyof ExpectedConfig> }

/**
 * Define your web-app configuration with precise types for provisions, variables, and secrets
 */
export function defineProject<T extends ExpectedConfig>(
  definer: (ctx: SyncedProjectContext) => ExactConfig<T>
): ReturnType<typeof genericDefineProject<'web-app'>> {
  return genericDefineProject<'web-app'>((ctx) => definer(ctx as SyncedProjectContext) as ExpectedConfig)
}

/** Generic DAB builder helpers for routers, rules, and middlewares. */
export { middleware, router, rule } from '@botpress-private/dab'
