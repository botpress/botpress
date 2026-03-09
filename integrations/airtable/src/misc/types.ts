import type * as bp from '.botpress'

export type Configuration = bp.configuration.Configuration
export type IntegrationProps = bp.IntegrationProps
export type IntegrationCtx = bp.Context

export type RegisterFunction = IntegrationProps['register']
export type UnregisterFunction = IntegrationProps['unregister']
export type Channels = IntegrationProps['channels']
export type Handler = IntegrationProps['handler']
export type { CreatableField } from './field-schemas'
export type TableFields = import('./field-schemas').CreatableField[]
