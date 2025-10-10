import channel from './channel'
import feed from './feed'
import * as bp from '.botpress'

export default {
  channel,
  feed,
} satisfies bp.IntegrationProps['channels']
