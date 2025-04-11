import * as bp from '.botpress'

import { PageCommentPublisher } from './publishers/page-comment'

export const channels = {
  comments: {
    messages: {
      text: PageCommentPublisher.publishFooterComment,
    },
  },
} as const satisfies bp.IntegrationProps['channels']
