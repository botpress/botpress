import { listMessages } from './list-messages'
import * as bp from '.botpress'

export const actions = {
  listMessages,
} as const satisfies bp.IntegrationProps['actions']
