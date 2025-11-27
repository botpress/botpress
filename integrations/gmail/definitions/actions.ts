import * as sdk from '@botpress/sdk'
import { deleteMessage } from './actions/delete-message'
import { getMessage } from './actions/get-message'
import { listMessages } from './actions/list-message'

export const actions = {
  listMessages,
  getMessage,
  deleteMessage,
} as const satisfies sdk.IntegrationDefinitionProps['actions']
