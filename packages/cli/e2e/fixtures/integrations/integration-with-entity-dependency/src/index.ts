import * as bp from '.botpress'

export default new bp.Integration({
  register: async () => {
    throw new Error('Not implemented')
  },
  unregister: async () => {
    throw new Error('Not implemented')
  },
  actions: {},
  channels: {},
  handler: async () => {},
})
