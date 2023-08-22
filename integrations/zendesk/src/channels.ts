import '@botpress/client'
import { getZendeskClient } from './client'
import { INTEGRATION_NAME } from './const'
import { IntegrationProps } from '.botpress'

export default {
  ticket: {
    messages: {
      text: async ({ client, logger, ...props }) => {
        const ticketId = props.conversation.tags[`${INTEGRATION_NAME}:id`]!
        const { user } = await client.getUser({
          id: props.user.id,
        })

        const zendeskAuthorId = user.tags['zendesk:id']
        if (!zendeskAuthorId) {
          const msg = 'Could not find zendesk id'
          logger.forBot().error(msg)
          throw new Error(msg)
        }

        return await getZendeskClient(props.ctx.configuration).createComment(
          ticketId,
          zendeskAuthorId,
          props.payload.text
        )
      },
    },
  },
} satisfies IntegrationProps['channels']
