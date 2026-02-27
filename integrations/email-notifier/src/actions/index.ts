import { sendMail } from './send-mail'
import * as bp from '.botpress'

export default {
  sendMail,
} satisfies bp.IntegrationProps['actions']
