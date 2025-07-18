import * as actions from './actions'
import { defaultChannel } from './channels'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async (props) => {
    await actions._syncEmails(props, false)
    props.logger.forBot().info('Finished syncing to the inbox for the first time')
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
