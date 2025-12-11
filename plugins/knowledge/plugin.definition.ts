import * as sdk from '@botpress/sdk'
import llm from './bp_modules/llm'

export default new sdk.PluginDefinition({
  name: 'knowledge',
  version: '1.0.0',
  configuration: { schema: sdk.z.object({}) },
  interfaces: {
    llm: sdk.version.allWithinMajorOf(llm),
  },
})
