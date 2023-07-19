import type { IntegrationContext } from '@botpress/sdk'
import type * as botpress from '.botpress'

export type Configuration = botpress.configuration.Configuration
export type IntegrationCtx = IntegrationContext<Configuration>
export type RegisterFunction = botpress.IntegrationProps['register']
export type UnregisterFunction = botpress.IntegrationProps['unregister']
export type Channels = botpress.IntegrationProps['channels']
export type Handler = botpress.IntegrationProps['handler']
