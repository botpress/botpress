import type * as bpsdk from '@botpress/sdk'

export type SdkEntityDef = NonNullable<bpsdk.IntegrationDefinition['entities']>[string]
export type SdkActionDef = NonNullable<bpsdk.IntegrationDefinition['actions']>[string]
export type SdkEventDef = NonNullable<bpsdk.IntegrationDefinition['events']>[string]
