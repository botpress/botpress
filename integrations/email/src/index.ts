import * as actions from './actions'
import { defaultChannel } from './channels'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async (props) => {
    await actions.register(props)
  },
  unregister: async () => {},
  actions: {
    listEmails: actions.listEmails,
    syncEmails: actions.syncEmails,
    sendEmail: actions.sendEmail,
  },
  handler: async () => {},
  channels: {
    default: defaultChannel,
  },
})
