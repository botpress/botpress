import * as bp from '.botpress'

export default new bp.Integration({
  register() {
    throw new Error('Not implemented')
  },
  unregister() {
    throw new Error('Not implemented')
  },
  actions: {
    manipulateItem() {
      throw new Error('Not implemented')
    },
  },
  channels: {},
  handler() {
    throw new Error('Not implemented')
  },
})
