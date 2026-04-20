import * as sdk from '@botpress/sdk'

export default new sdk.PluginDefinition({
  name: 'logger',
  version: '0.0.1',
  configuration: { schema: sdk.z.object({}) },
})
