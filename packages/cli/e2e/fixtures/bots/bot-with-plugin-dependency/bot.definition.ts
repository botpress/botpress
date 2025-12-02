import * as sdk from '@botpress/sdk'
import integrationWithEntityDependency from './bp_modules/integration-with-entity-dependency'
import pluginWithInterfaceDependency from './bp_modules/plugin-with-interface-dependency'

export default new sdk.BotDefinition({})
  .addIntegration(integrationWithEntityDependency, {
    alias: 'integration-with-entity-dep',
    enabled: true,
    configuration: {},
  })
  .addPlugin(pluginWithInterfaceDependency, {
    alias: 'plugin-alias',
    configuration: {
      foo: 'bar',
      item: {
        id: 'foo',
        name: 'Foo',
        color: 'blue',
      },
    },
    dependencies: {
      'interface-alias': {
        integrationAlias: 'integration-with-entity-dep',
        integrationInterfaceAlias: Object.keys(integrationWithEntityDependency.definition.interfaces)[0]!,
      },
    },
  })
