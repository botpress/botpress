export * as messages from './message'
export * from './const'
export * from './serve'

export {
  IntegrationDefinition,
  IntegrationDefinitionProps,
  IntegrationImplementation as Integration,
  IntegrationImplementationProps as IntegrationProps,
  IntegrationContext,
  IntegrationSpecificClient,
} from './integration'

export { Bot, BotProps, BotContext, BotSpecificClient, IntegrationInstance } from './bot'

/**
 * @deprecated Infer type of integration message handlers instead
 */
export type AckFunction = (props: { tags: Record<string, string> }) => Promise<void>
