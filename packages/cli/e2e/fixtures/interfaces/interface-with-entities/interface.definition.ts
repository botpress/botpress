import * as sdk from '@botpress/sdk'
import * as packageJson from './package.json'

export default new sdk.InterfaceDefinition({
  name: packageJson.interfaceName,
  version: '1.0.0',
  entities: {
    item: {
      schema: sdk.z.object({
        id: sdk.z.string(),
        name: sdk.z.string().optional(),
      }),
    },
  },
  actions: {
    manipulateItem: {
      input: {
        schema: (entities) =>
          sdk.z.object({
            item: entities.item,
            foo: sdk.z.number(),
          }),
      },
      output: {
        schema: () => sdk.z.object({}),
      },
    },
  },
  events: {
    somethingHappened: {
      schema: (entities) =>
        sdk.z.object({
          item: entities.item,
          message: sdk.z.string(),
        }),
    },
  },
})
