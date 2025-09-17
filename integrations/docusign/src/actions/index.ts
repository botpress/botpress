import { sendEnvelope } from './send-envelope'
import * as bp from '.botpress'

export default {
  sendEnvelope,
} satisfies bp.IntegrationProps['actions']
