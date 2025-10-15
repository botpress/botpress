import type * as bp from '.botpress'

export type Configuration = bp.configuration.Configuration
export type IntegrationProps = bp.IntegrationProps
export type IntegrationCtx = bp.Context

export type RegisterFunction = IntegrationProps['register']
export type UnregisterFunction = IntegrationProps['unregister']
export type Channels = IntegrationProps['channels']
export type Handler = IntegrationProps['handler']
export type TableFields = Array<{ name: string; type: string }>

export type AirtableTable = {
  id: string
  name: string
  description?: string
  primaryFieldId: string
  fields: Array<{ id: string; name: string; type: string }>
}
