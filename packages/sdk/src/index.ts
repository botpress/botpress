export * as messages from './message'
export * from './public-consts'
export * from './serve'
export * from './zui'

// Backward-compatibility for old constants that were not SCREAMING_SNAKE_CASE:
export {
  /** @deprecated please use `BOT_ID_HEADER` instead */
  BOT_ID_HEADER as botIdHeader,
  /** @deprecated please use `BOT_USER_ID_HEADER` instead */
  BOT_USER_ID_HEADER as botUserIdHeader,
  /** @deprecated please use `INTEGRATION_ID_HEADER` instead */
  INTEGRATION_ID_HEADER as integrationIdHeader,
  /** @deprecated please use `WEBHOOK_ID_HEADER` instead */
  WEBHOOK_ID_HEADER as webhookIdHeader,
  /** @deprecated please use `CONFIGURATION_TYPE_HEADER` instead */
  CONFIGURATION_TYPE_HEADER as configurationTypeHeader,
  /** @deprecated please use `CONFIGURATION_PAYLOAD_HEADER` instead */
  CONFIGURATION_PAYLOAD_HEADER as configurationHeader,
  /** @deprecated please use `OPERATION_TYPE_HEADER` instead */
  OPERATION_TYPE_HEADER as operationHeader,
  /** @deprecated please use `OPERATION_SUBTYPE_HEADER` instead */
  OPERATION_SUBTYPE_HEADER as typeHeader,
} from './public-consts'

export {
  //
  isApiError,
  RuntimeError,
} from '@botpress/client'

export {
  DefaultIntegration,
  IntegrationDefinition,
  IntegrationDefinitionProps,
  IntegrationImplementation as Integration,
  IntegrationImplementationProps as IntegrationProps,
  IntegrationLogger,
  IntegrationSpecificClient,
  TagDefinition,
  ConfigurationDefinition,
  AdditionalConfigurationDefinition,
  EventDefinition,
  ChannelDefinition,
  MessageDefinition,
  ActionDefinition,
  StateDefinition,
  UserDefinition,
  SecretDefinition,
  EntityDefinition,
} from './integration'

export {
  /**
   * @deprecated use Context exported from '.botpress' instead
   */
  IntegrationContext,
} from './integration/server'

export {
  DefaultBot,
  BotDefinition,
  BotDefinitionProps,
  BotImplementation as Bot,
  BotImplementationProps as BotProps,
  BotSpecificClient,
  InjectedBotHandlers as BotHandlers,
  TagDefinition as BotTagDefinition,
  StateType as BotStateType,
  StateDefinition as BotStateDefinition,
  RecurringEventDefinition as BotRecurringEventDefinition,
  EventDefinition as BotEventDefinition,
  ConfigurationDefinition as BotConfigurationDefinition,
  UserDefinition as BotUserDefinition,
  ConversationDefinition as BotConversationDefinition,
  MessageDefinition as BotMessageDefinition,
  ActionDefinition as BotActionDefinition,
  TableDefinition as BotTableDefinition,
  WorkflowDefinition as BotWorkflowDefinition,
  BotLogger,
} from './bot'

export {
  //
  InterfaceDefinition,
  InterfaceDefinitionProps,
} from './interface'

export {
  //
  DefaultPlugin,
  PluginDefinition,
  PluginDefinitionProps,
  PluginImplementation as Plugin,
  PluginImplementationProps as PluginProps,
  PluginRuntimeProps,
  InjectedPluginHandlers as PluginHandlers,
} from './plugin'

export {
  //
  IntegrationPackage,
  InterfacePackage,
  PluginPackage,
  Package,
} from './package'
