import { RuntimeError } from '@botpress/sdk'
import * as smtp from './smtp'
import * as bp from '.botpress'

export const defaultChannel = {
  messages: {
    text: async (props) => {
      if (!props.conversation.tags.to) throw new RuntimeError("Tried sending an email without a 'to' header")

      await smtp.sendNodemailerMail(
        props.ctx.configuration,
        {
          to: props.conversation.tags.to,
          subject: 'Sent from botpress email integration',
          text: props.payload.text,
          inReplyTo: props.conversation.tags.latestEmail,
          replyTo: props.ctx.configuration.user,
        },
        props.logger
      )
    },
  },
} satisfies bp.IntegrationProps['channels']['default']
