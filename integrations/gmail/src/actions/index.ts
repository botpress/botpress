import * as bp from '.botpress'
import { getMyEmail } from './get-my-email'
import { sendEmail } from './send-email'
import { checkInbox } from './check-inbox'
import { getEmail } from './get-email'

export const actions = {
  getMyEmail,
  sendEmail,
  checkInbox,
  getEmail,
} as const satisfies bp.IntegrationProps['actions']
