import * as sdk from '@botpress/sdk'

export type ActionDefinitions = NonNullable<sdk.IntegrationDefinitionProps['actions']>
export type ActionDef = ActionDefinitions[string]
