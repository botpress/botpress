import type { IntegrationContext } from '@botpress/sdk'
import type * as botpress from '.botpress'
import type { Configuration } from '.botpress/implementation/configuration'

export type Config = botpress.configuration.Configuration
export type IntegrationCtx = IntegrationContext<Configuration>

export type IntegrationProps = botpress.IntegrationProps
export type RegisterFunction = IntegrationProps['register']
export type UnregisterFunction = IntegrationProps['unregister']
export type Channels = IntegrationProps['channels']
export type Handler = IntegrationProps['handler']
