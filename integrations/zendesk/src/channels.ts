import { getZendeskClient } from './client'
import { INTEGRATION_NAME } from './const'
import { IntegrationProps } from '.botpress'

export default {
  ticket: {
    messages: {
      text: async ({ ...props }) => {
        const { user } = await props.client.getUser({ id: props.payload.userId })
        if (user.tags?.origin === 'zendesk') {
          return
        }

        // Keep the integration name in those tags
        const ticketId = props.conversation!.tags[`${INTEGRATION_NAME}:id`]!
        const zendeskUserId = user.tags[`${INTEGRATION_NAME}:id`]!

        return await getZendeskClient(props.ctx.configuration).createComment(
          ticketId,
          zendeskUserId,
          props.payload.text
        )
      },
    },
  },
} satisfies IntegrationProps['channels']
