import { sendTransactionalEmail } from './send-transactional-email'
import * as bp from '.botpress'

export default {
  sendTransactionalEmail,
} satisfies bp.IntegrationProps['actions']
