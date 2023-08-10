import { getZendeskClient } from './client'
import type { Channels } from './types'

export default {
  ticket: {
    messages: {
      text: async ({ ...props }) => {
        const { user } = await props.client.getUser({ id: props.payload.userId })
        if (user.tags?.origin === 'zendesk') {
          return
        }

        const ticketId = props.conversation!.tags['zendesk:id']!
        const zendeskUserId = user.tags['zendesk:id']!

        return await getZendeskClient(props.ctx.configuration).createComment(
          ticketId,
          zendeskUserId,
          props.payload.text
        )
      },
    },
  },
} satisfies Channels
