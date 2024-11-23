import * as sdk from '@botpress/sdk'

export default new sdk.PluginDefinition({
  name: 'analytics',
  version: '0.0.1',
  actions: {
    track: {
      input: {
        schema: sdk.z.object({ name: sdk.z.string(), count: sdk.z.number() }),
      },
      output: {
        schema: sdk.z.object({}),
      },
    },
  },
})
