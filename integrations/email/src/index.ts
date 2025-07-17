import { actions, sendNodemailerMail } from './actions'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async () => {
    // TODO: test the config here to throw as early as possible
  },
  unregister: async () => {},
  actions,
  handler: async () => {},
  channels: {
    default: {
      messages: {
        text: async (props) => {
          await sendNodemailerMail(props.ctx.configuration, {
            to: props.conversation.tags.to!,
            subject: 'Sent from botpress email integration',
            text: props.payload.text,
            inReplyTo: props.conversation.tags.latestEmail,
            replyTo: props.conversation.tags.latestEmail !== undefined ? props.ctx.configuration.user! : undefined,
          })
        },
      },
    },
  },
})
