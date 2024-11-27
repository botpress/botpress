import * as sdk from '@botpress/sdk'
import llm from './bp_modules/llm'

export default new sdk.PluginDefinition({
  name: 'knowledge',
  version: '0.0.1',
  states: {},
}).addInterface(llm)
