import * as actions from './actions'
import * as channels from './channels'
import * as setup from './setup'
import * as bp from '.botpress'

export default new bp.Integration({
  register: setup.register,
  unregister: setup.unregister,
  actions: {
    listEmails: actions.listEmails,
    getEmail: actions.getEmail,
    syncEmails: actions.syncEmails,
    sendEmail: actions.sendEmail,
  },
  channels: {
    default: channels.defaultChannel,
  },
  handler: async () => {},
})
