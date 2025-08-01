import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    big: async (props) => {
      const res = 'a'.repeat(2 ** 20)
      return { out: res }
    },
  },
  channels: {},
  handler: async () => {},
})
