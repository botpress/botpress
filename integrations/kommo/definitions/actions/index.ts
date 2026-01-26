import * as sdk from '@botpress/sdk'
import { actions as leadActions } from './lead'
import { actions as contactActions } from './contact'

export const actions = {
  ...leadActions,
  ...contactActions,
} as const satisfies sdk.IntegrationDefinitionProps['actions']