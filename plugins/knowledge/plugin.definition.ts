import * as sdk from '@botpress/sdk'
import semver from 'semver'
import llm from './bp_modules/llm'

export default new sdk.PluginDefinition({
  name: 'knowledge',
  version: '1.0.0',
  configuration: { schema: sdk.z.object({}) },
  interfaces: {
    llm: { ...llm, version: `>=${semver.major(llm.version)}.0.0 <${semver.major(llm.version) + 1}.0.0` },
  },
})
