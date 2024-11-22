import * as sdk from '@botpress/sdk'

export default new sdk.PluginDefinition({
  name: 'logger',
  version: '0.0.1',
  actions: {
    log: {
      input: {
        schema: sdk.z.object({ message: sdk.z.unknown() }),
      },
      output: {
        schema: sdk.z.object({}),
      },
    },
  },
})
