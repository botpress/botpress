import * as sdk from '@botpress/sdk'
import interfaceWithEntities from './bp_modules/interface-with-entities'
import * as packageJson from './package.json'

export default new sdk.PluginDefinition({
  name: packageJson.pluginName,
  version: '1.0.0',
  interfaces: {
    'interface-alias': interfaceWithEntities,
  },
  actions: {
    doSomething: {
      input: {
        schema: ({ entities }) =>
          sdk.z.object({
            item: entities['interface-alias'].item,
            bar: sdk.z.number(),
          }),
      },
      output: {
        schema: sdk.z.object({}),
      },
    },
  },
})
