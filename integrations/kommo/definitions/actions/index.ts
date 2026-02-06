import * as sdk from '@botpress/sdk'
import { actions as contactActions } from './contact'
import { actions as leadActions } from './lead'

export const actions = {
  ...leadActions,
  ...contactActions,
} as const satisfies sdk.IntegrationDefinitionProps['actions']
