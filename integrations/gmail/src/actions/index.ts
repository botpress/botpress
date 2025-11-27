import { getMessage } from './get-message'
import { listMessages } from './list-messages'
import * as bp from '.botpress'

export const actions = {
  listMessages,
  getMessage,
} as const satisfies bp.IntegrationProps['actions']
