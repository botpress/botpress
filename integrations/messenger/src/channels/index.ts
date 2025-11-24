import channel from './channel'
import commentReplies from './comment-replies'
import * as bp from '.botpress'

export default {
  channel,
  commentReplies,
} satisfies bp.IntegrationProps['channels']
