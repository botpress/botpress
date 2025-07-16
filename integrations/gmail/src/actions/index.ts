import * as bp from '.botpress'
import { getMyEmail } from './get-my-email'
<<<<<<< HEAD
import { sendEmail } from './send-email'
import { checkNewEmails } from './check-new-emails'

export const actions = {
  getMyEmail,
  sendEmail,
  checkNewEmails,
=======

export const actions = {
  getMyEmail,
>>>>>>> 664ccdf2 (have getmyemail action)
} as const satisfies bp.IntegrationProps['actions']
