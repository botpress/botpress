import * as sdk from '@botpress/sdk'
import { actions as syncActions } from './sync'

export const actions = {
  ...syncActions,
} as const satisfies sdk.IntegrationDefinitionProps['actions']
