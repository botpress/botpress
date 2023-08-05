import type { Integration } from '@botpress/client'
import { casing } from '../../utils'
import { GENERATED_HEADER, INDEX_FILE } from '../const'
import { Module, ModuleDef } from '../module'
import { ActionsModule } from './actions-zod-module'
import { ChannelsModule } from './channels-zod-module'
import { ConfigurationModule } from './configuration-zod-module'
import { EventsModule } from './events-zod-module'

export class IntegrationInstanceIndexModule extends Module {
  public static async create(integration: Integration): Promise<IntegrationInstanceIndexModule> {
    const { name } = integration

    const configModule = await ConfigurationModule.create(integration.configuration ?? { schema: {} })
    configModule.unshift('configuration')

    const actionsModule = await ActionsModule.create(integration.actions ?? {})
    actionsModule.unshift('actions')

    const channelsModule = await ChannelsModule.create(integration.channels ?? {})
    channelsModule.unshift('channels')

    const eventsModule = await EventsModule.create(integration.events ?? {})
    eventsModule.unshift('events')

    const exportName = casing.to.pascalCase(name)

    const inst = new IntegrationInstanceIndexModule(
      integration,
      configModule,
      actionsModule,
      channelsModule,
      eventsModule,
      {
        path: INDEX_FILE,
        content: '',
        exportName,
      }
    )

    inst.pushDep(configModule)
    inst.pushDep(actionsModule)
    inst.pushDep(channelsModule)
    inst.pushDep(eventsModule)

    return inst
  }

  private constructor(
    private integration: Integration,
    private configModule: ConfigurationModule,
    private actionsModule: ActionsModule,
    private channelsModule: ChannelsModule,
    private eventsModule: EventsModule,
    def: ModuleDef
  ) {
    super(def)
  }

  public override get content(): string {
    const { configModule, actionsModule, channelsModule, eventsModule, integration } = this

    const configImport = configModule.import(this)
    const actionsImport = actionsModule.import(this)
    const channelsImport = channelsModule.import(this)
    const eventsImport = eventsModule.import(this)

    const { name, version, id } = integration
    const className = casing.to.pascalCase(name)
    const propsName = `${className}Props`

    const lines = [
      "import type { IntegrationInstance } from '@botpress/sdk'",
      "import { z } from 'zod'",
      '',
      `import { ${configModule.exports} } from "./${configImport}"`,
      `import { ${actionsModule.exports} } from "./${actionsImport}"`,
      `import { ${channelsModule.exports} } from "./${channelsImport}"`,
      `import { ${eventsModule.exports} } from "./${eventsImport}"`,
      '',
      `type Configuration = z.infer<typeof ${configModule.exports}.schema>`,
      '',
      `export type ${propsName} = {`,
      '  enabled?: boolean',
      '  config?: Configuration',
      '}',
      '',
      `export class ${className} implements IntegrationInstance<'${name}'> {`,
      '',
      `  public readonly name = '${name}'`,
      `  public readonly version = '${version}'`,
      `  public readonly id = '${id}'`,
      '',
      '  public readonly enabled?: boolean',
      '  public readonly configuration?: Configuration',
      '',
      '  public readonly definition = {',
      `    configuration: ${configModule.name},`,
      `    actions: ${actionsModule.name},`,
      `    channels: ${channelsModule.name},`,
      `    events: ${eventsModule.name},`,
      '  }',
      '',
      `  constructor(props?: ${propsName}) {`,
      '    this.enabled = props?.enabled',
      '    this.configuration = props?.config',
      '  }',
      '}',
    ]

    return `${GENERATED_HEADER}\n${lines.join('\n')}`
  }
}
