import { CardCommentPublisher } from './publishers/card-comments'
import * as bp from '.botpress'

export const channels = {
  cardComments: {
    messages: {
      text: CardCommentPublisher.publishTextMessage,
    },
  },
} as const satisfies bp.IntegrationProps['channels']
