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
          await sendNodemailerMail(
            props.ctx.configuration,
            props.user.tags.email!,
            'Botpress email',
            props.payload.text
          )
        },
      },
    },
  },
})
