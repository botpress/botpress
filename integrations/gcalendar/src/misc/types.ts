import type { IntegrationContext } from '@botpress/sdk'
import type * as bp from '.botpress'

export type Configuration = bp.configuration.Configuration
export type Implementation = ConstructorParameters<typeof bp.Integration>[0]
export type IntegrationCtx = IntegrationContext<Configuration>

export type RegisterFunction = Implementation['register']
export type UnregisterFunction = Implementation['unregister']
export type Channels = Implementation['channels']
export type Handler = Implementation['handler']
