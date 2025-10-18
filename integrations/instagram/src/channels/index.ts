import { channel } from './channel'
import { comment } from './comment'
import * as bp from '.botpress'

export default {
  channel,
  comment,
} satisfies bp.IntegrationProps['channels']
