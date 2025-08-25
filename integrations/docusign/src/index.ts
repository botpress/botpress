import * as bp from '.botpress'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    sendReminder: async () => {
      return {}
    },
  },
  channels: {},
  handler: async () => {},
})
