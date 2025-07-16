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
          const { user } = await props.client.getUser({ id: props.user.id })

          await sendNodemailerMail(
            props.ctx.configuration,
            props.conversation.tags.to!,
            'Sent from botpress email integration',
            props.payload.text
          )
        },
      },
    },
  },
})
