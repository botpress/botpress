import { PageCommentPublisher } from './publishers/page-comment'
import * as bp from '.botpress'

export const channels = {
  comment: {
    messages: {
      text: PageCommentPublisher.publishFooterComment,
    },
  },
} as const satisfies bp.IntegrationProps['channels']
