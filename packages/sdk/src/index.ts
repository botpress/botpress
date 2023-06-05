import { BotClient } from './bot'
import { IntegrationClient } from './integration'

export * as messages from './message'
export const clients = { IntegrationClient, BotClient }

export * from './const'
export * from './serve'

export {
  IntegrationDefinition,
  IntegrationDefinitionProps,
  IntegrationImplementation as Integration,
  IntegrationImplementationProps as IntegrationProps,
  IntegrationContext,
  IntegrationOperation,
  ActionDefinitions,
  ChannelDefinitions,
  EventDefinitions,
  AckFunction,
} from './integration'
export { Bot, BotContext, BotOperation, IntegrationInstance } from './bot'
