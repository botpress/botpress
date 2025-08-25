import { sendReminder } from './send-reminder'
import * as bp from '.botpress'

export default {
  sendReminder,
} satisfies bp.IntegrationProps['actions']
