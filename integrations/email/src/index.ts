import * as actions from './actions'
import { defaultChannel } from './channels'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async () => {
    // TODO: test the config here to throw as early as possible
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
