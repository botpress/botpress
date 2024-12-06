import * as bp from '.botpress'

const plugin = new bp.Plugin({
  actions: {
    track: async ({ input, client }) => {
      return await client.trackAnalytics({ name: input.name, count: input.count })
    },
  },
})

export default plugin
