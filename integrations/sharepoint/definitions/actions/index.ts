import * as sdk from '@botpress/sdk'
import { addToSync } from './sync'

export const actions = {
  addToSync,
} as const satisfies sdk.IntegrationDefinitionProps['actions']
