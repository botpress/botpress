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
  AckFunction,
} from './integration'

export { Bot, BotProps, IntegrationInstance, BotContext } from './bot'
