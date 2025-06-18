import sgMail from '@sendgrid/mail'
import actions from './actions'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async (props) => {
    sgMail.setApiKey(props.ctx.configuration.apiKey)
  },
  unregister: async () => {},
  actions,
  channels: {},
  handler: async () => {},
})
