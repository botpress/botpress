import * as sdk from '@botpress/sdk'
import { getMessage } from './actions/get-message'
import { listMessages } from './actions/list-message'

export const actions = {
  listMessages,
  getMessage,
} as const satisfies sdk.IntegrationDefinitionProps['actions']
