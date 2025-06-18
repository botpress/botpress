import * as sdk from '@botpress/sdk'
import interfaceWithEntities from './bp_modules/interface-with-entities'
import * as packageJson from './package.json'

export default new sdk.IntegrationDefinition({
  name: packageJson.integrationName,
  version: '1.0.0',
  entities: {
    customItem: {
      schema: sdk.z.object({
        id: sdk.z.string(),
        name: sdk.z.string().optional(),
        color: sdk.z.string().optional(),
      }),
    },
  },
}).extend(interfaceWithEntities, ({ entities }) => ({ entities: { item: entities.customItem } }))
