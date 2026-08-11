import { z } from '@botpress/sdk'
import type * as bp from '.botpress'

const RESERVED_CONFIGURATION_KEY = '__botpress_reserved'
const HITL_DEPENDENCY_ALIAS = 'hitl'

const SYMBOL_RENAMES_SCHEMA = z.record(z.string()).optional()
const DELIVERED_BACKING_INTEGRATION_SCHEMA = z.union([
  z.string().min(1),
  z.object({ alias: z.string().min(1), actions: SYMBOL_RENAMES_SCHEMA, events: SYMBOL_RENAMES_SCHEMA }),
])

/**
 * The integration instance backing HITL sessions: its alias plus the
 * interface symbols the implementation renames. Each rename map is keyed by
 * the interface's symbol name and gives the implementation's name for it;
 * an absent map or entry means the symbol keeps its interface name.
 */
export type HitlBackingIntegration = {
  alias: string
  actions?: Record<string, string>
  events?: Record<string, string>
}

/**
 * Resolves the backing integration from the mapping the Bridge delivers in
 * `ctx.configuration`, falling back to the compiled interface dependency.
 * `source` tells where the result came from; session migration only ever
 * triggers when `ctx.configuration` named the backing integration.
 */
export const resolveBackingIntegration = (props: {
  ctx: { configuration: { payload: string } }
  alias: string
  interfaces: {
    hitl: {
      integrationAlias: string
      actions: Record<string, { name: string }>
      events: Record<string, { name: string }>
    }
  }
}): HitlBackingIntegration & { source: 'configuration' | 'compiled' } => {
  const reservedValue = (props.ctx.configuration as Record<string, unknown>)[RESERVED_CONFIGURATION_KEY] as
    | { ifaces?: Record<string, Record<string, unknown>> }
    | undefined

  const parseResult = DELIVERED_BACKING_INTEGRATION_SCHEMA.safeParse(
    reservedValue?.ifaces?.[props.alias]?.[HITL_DEPENDENCY_ALIAS]
  )

  if (parseResult.success) {
    const deliveredMapping = parseResult.data

    return typeof deliveredMapping === 'string'
      ? { alias: deliveredMapping, source: 'configuration' }
      : { ...deliveredMapping, source: 'configuration' }
  }

  const compiledDependency = props.interfaces.hitl

  return {
    alias: compiledDependency.integrationAlias,
    actions: _extractCompiledSymbolRenames(compiledDependency.actions),
    events: _extractCompiledSymbolRenames(compiledDependency.events),
    source: 'compiled',
  }
}

/**
 * Resolves the backing integration to address for an existing downstream
 * conversation: the current one (with its renames) when the conversation
 * lives on it, the compiled dependency (whose renames are compiled in) when
 * the conversation lives there, otherwise the conversation's own integration
 * addressed by its verbatim interface symbol names.
 */
export const resolveBackingIntegrationForDownstreamConversation = (args: {
  props: Parameters<typeof resolveBackingIntegration>[0]
  downstreamIntegrationAlias: string
}): HitlBackingIntegration => {
  const backingIntegration = resolveBackingIntegration(args.props)

  if (backingIntegration.alias === args.downstreamIntegrationAlias) {
    return backingIntegration
  }

  const compiledDependency = args.props.interfaces.hitl

  if (compiledDependency.integrationAlias === args.downstreamIntegrationAlias) {
    return {
      alias: compiledDependency.integrationAlias,
      actions: _extractCompiledSymbolRenames(compiledDependency.actions),
      events: _extractCompiledSymbolRenames(compiledDependency.events),
    }
  }

  return { alias: args.downstreamIntegrationAlias }
}

export const callBackingIntegrationAction = async <TOperation extends keyof bp.interfaces.hitl.actions.Actions>(props: {
  client: bp.HookHandlerProps['before_incoming_message']['client']
  backingIntegration: HitlBackingIntegration
  name: TOperation
  input: NoInfer<bp.interfaces.hitl.actions.Actions[TOperation]['input']>
}): Promise<NoInfer<bp.interfaces.hitl.actions.Actions[TOperation]['output']>> => {
  const { output } = await props.client.callAction({
    type: `${props.backingIntegration.alias}:${props.backingIntegration.actions?.[props.name] ?? props.name}`,
    input: props.input,
  })

  return output
}

const _extractCompiledSymbolRenames = (symbols: Record<string, { name: string }>): Record<string, string> =>
  Object.fromEntries(Object.entries(symbols).flatMap(([symbol, { name }]) => (name === symbol ? [] : [[symbol, name]])))
