import type { IntegrationContext } from '@botpress/sdk'
import type * as bp from '.botpress'

export type Configuration = bp.configuration.Configuration
export type IntegrationProps = ConstructorParameters<typeof bp.Integration>[0]
export type IntegrationCtx = IntegrationContext<Configuration>

export type RegisterFunction = IntegrationProps['register']
export type UnregisterFunction = IntegrationProps['unregister']
export type Channels = IntegrationProps['channels']
export type Handler = IntegrationProps['handler']
