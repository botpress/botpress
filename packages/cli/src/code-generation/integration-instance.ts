import { casing } from '../utils'
import { GENERATED_HEADER, INDEX_FILE } from './const'
import { stringifySingleLine } from './generators'
import { ActionsModule } from './integration-schemas/actions-module'
import { ChannelsModule } from './integration-schemas/channels-module'
import { DefaultConfigurationModule } from './integration-schemas/configuration-module'
import { ConfigurationsModule } from './integration-schemas/configurations-module'
import { EntitiesModule } from './integration-schemas/entities-module'
import { EventsModule } from './integration-schemas/events-module'
import { StatesModule } from './integration-schemas/states-module'
import { Module, ModuleDef } from './module'
import * as types from './typings'

export class IntegrationInstanceIndexModule extends Module {
  public static async create(integration: types.IntegrationDefinition): Promise<IntegrationInstanceIndexModule> {
    const { name } = integration

    const defaultConfigModule = await DefaultConfigurationModule.create(integration.configuration ?? { schema: {} })
    defaultConfigModule.unshift('configuration')

    const configurationsModule = await ConfigurationsModule.create(integration.configurations ?? {})
    configurationsModule.unshift('configurations')

    const actionsModule = await ActionsModule.create(integration.actions ?? {})
    actionsModule.unshift('actions')

    const channelsModule = await ChannelsModule.create(integration.channels ?? {})
    channelsModule.unshift('channels')

    const eventsModule = await EventsModule.create(integration.events ?? {})
    eventsModule.unshift('events')

    const statesModule = await StatesModule.create(integration.states ?? {})
    statesModule.unshift('states')

    const entitiesModule = await EntitiesModule.create(integration.entities ?? {})
    entitiesModule.unshift('entities')

    const exportName = casing.to.pascalCase(name)

    const inst = new IntegrationInstanceIndexModule(
      integration,
      defaultConfigModule,
      configurationsModule,
      actionsModule,
      channelsModule,
      eventsModule,
      statesModule,
      entitiesModule,
      {
        path: INDEX_FILE,
        content: '',
        exportName,
      }
    )

    inst.pushDep(defaultConfigModule)
    inst.pushDep(configurationsModule)
    inst.pushDep(actionsModule)
    inst.pushDep(channelsModule)
    inst.pushDep(eventsModule)
    inst.pushDep(statesModule)
    inst.pushDep(entitiesModule)

    return inst
  }

  private constructor(
    private _integration: types.IntegrationDefinition,
    private _defaultConfigModule: DefaultConfigurationModule,
    private _configurationsModule: ConfigurationsModule,
    private _actionsModule: ActionsModule,
    private _channelsModule: ChannelsModule,
    private _eventsModule: EventsModule,
    private _statesModule: StatesModule,
    private _entitiesModule: EntitiesModule,
    def: ModuleDef
  ) {
    super(def)
  }

  public override get content(): string {
    const {
      _defaultConfigModule: defaultConfigModule,
      _configurationsModule: configurationsModule,
      _actionsModule: actionsModule,
      _channelsModule: channelsModule,
      _eventsModule: eventsModule,
      _statesModule: statesModule,
      _entitiesModule: entitiesModule,
      _integration: integration,
    } = this

    const defaultConfigImport = defaultConfigModule.import(this)
    const configurationsImport = configurationsModule.import(this)
    const actionsImport = actionsModule.import(this)
    const channelsImport = channelsModule.import(this)
    const eventsImport = eventsModule.import(this)
    const statesImport = statesModule.import(this)
    const entitiesImport = entitiesModule.import(this)

    const { name, version, id } = integration
    const className = casing.to.pascalCase(name)
    const propsName = `${className}Props`
    const configName = `${className}Config`

    const integrationId = id === null ? 'null' : `'${id}'`

    const lines = [
      GENERATED_HEADER,
      "import type { IntegrationInstance } from '@botpress/sdk'",
      '',
      `import type * as ${defaultConfigModule.name} from "./${defaultConfigImport}"`,
      `import type * as ${configurationsModule.name} from "./${configurationsImport}"`,
      `import type * as ${actionsModule.name} from "./${actionsImport}"`,
      `import type * as ${channelsModule.name} from "./${channelsImport}"`,
      `import type * as ${eventsModule.name} from "./${eventsImport}"`,
      `import type * as ${statesModule.name} from "./${statesImport}"`,
      `import type * as ${entitiesModule.name} from "./${entitiesImport}"`,
      `export * as ${defaultConfigModule.name} from "./${defaultConfigImport}"`,
      `export * as ${configurationsModule.name} from "./${configurationsImport}"`,
      `export * as ${actionsModule.name} from "./${actionsImport}"`,
      `export * as ${channelsModule.name} from "./${channelsImport}"`,
      `export * as ${eventsModule.name} from "./${eventsImport}"`,
      `export * as ${statesModule.name} from "./${statesImport}"`,
      `export * as ${entitiesModule.name} from "./${entitiesImport}"`,
      '',
      '// type utils',
      'type ValueOf<T> = T[keyof T]',
      '',
      `export type ${configName} = {`,
      '  configType?: null',
      `  config?: ${defaultConfigModule.name}.${defaultConfigModule.exports}`,
      '} | ValueOf<{',
      `  [K in keyof ${configurationsModule.name}.${configurationsModule.exports}]: {`,
      '    configType: K',
      `    config?: ${configurationsModule.name}.${configurationsModule.exports}[K]`,
      '  }',
      '}>',
      '',
      `export type ${propsName} = {`,
      '  enabled?: boolean',
      `} & ${configName}`,
      '',
      `export type T${className} = {`,
      `  name: '${name}'`,
      `  version: '${version}'`,
      `  configuration: ${defaultConfigModule.name}.${defaultConfigModule.exports}`,
      `  configurations: ${configurationsModule.name}.${configurationsModule.exports}`,
      `  actions: ${actionsModule.name}.${actionsModule.exports}`,
      `  channels: ${channelsModule.name}.${channelsModule.exports}`,
      `  events: ${eventsModule.name}.${eventsModule.exports}`,
      `  states: ${statesModule.name}.${statesModule.exports}`,
      `  user: ${stringifySingleLine(this._integration.user)}`,
      `  entities: ${entitiesModule.name}.${entitiesModule.exports}`,
      '}',
      '',
      `export class ${className} implements IntegrationInstance<T${className}> {`,
      '',
      `  public readonly name = '${name}'`,
      `  public readonly version = '${version}'`,
      `  public readonly id = ${integrationId}`,
      '',
      '  public readonly enabled?: boolean',
      `  public readonly configurationType?: ${configName}['configType']`,
      `  public readonly configuration?: ${configName}['config']`,
      '',
      `  constructor(props?: ${propsName}) {`,
      '    this.enabled = props?.enabled',
      '    this.configurationType = props?.configType',
      '    this.configuration = props?.config',
      '  }',
      '}',
    ]

    return `${GENERATED_HEADER}\n${lines.join('\n')}`
  }
}
