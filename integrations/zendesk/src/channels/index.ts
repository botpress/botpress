import * as bp from '../../.botpress'
import { hitl } from './hitl'
import { messaging } from './messaging'

export default {
  messaging,
  hitl,
} satisfies bp.IntegrationProps['channels']
