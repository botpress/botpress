import * as bp from '.botpress'
import { getMyEmail } from './get-my-email'
import { sendEmail } from './send-email'
import { checkNewEmails } from './check-new-emails'

export const actions = {
  getMyEmail,
  sendEmail,
  checkNewEmails,
} as const satisfies bp.IntegrationProps['actions']
