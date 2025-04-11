import * as bp from '.botpress'

import { PageCommentPublisher } from './publishers/page-comment'

export const channels = {
  pageComments: {
    messages: {
      text: PageCommentPublisher.publishFooterComment,
    },
  },
} as const satisfies bp.IntegrationProps['channels']
