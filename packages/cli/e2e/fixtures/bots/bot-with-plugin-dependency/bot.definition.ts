import * as sdk from '@botpress/sdk'
import integrationWithEntityDependency from './bp_modules/integration-with-entity-dependency'
import pluginWithInterfaceDependency from './bp_modules/plugin-with-interface-dependency'

const extendedInterface = Object.values(integrationWithEntityDependency.definition.interfaces)[0]!

export default new sdk.BotDefinition({})
  .addIntegration(integrationWithEntityDependency, {
    enabled: true,
    configuration: {},
  })
  .addPlugin(pluginWithInterfaceDependency, {
    alias: 'plugin-alias',
    configuration: {},
    interfaces: {
      'interface-alias': {
        id: integrationWithEntityDependency.id,
        name: integrationWithEntityDependency.name,
        version: integrationWithEntityDependency.version,
        entities: extendedInterface.entities,
        actions: extendedInterface.actions,
        events: extendedInterface.events,
        channels: extendedInterface.channels,
      },
    },
  })
