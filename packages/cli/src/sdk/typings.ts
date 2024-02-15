import type * as sdk from '@botpress/sdk'

export type SdkEntityDef = NonNullable<sdk.IntegrationDefinition['entities']>[string]
export type SdkActionDef = NonNullable<sdk.IntegrationDefinition['actions']>[string]
export type SdkEventDef = NonNullable<sdk.IntegrationDefinition['events']>[string]

export type SdkEntityOperation = keyof NonNullable<SdkEntityDef['actions']>
export type SdkEntityEvent = keyof NonNullable<SdkEntityDef['events']>
