import type { IntegrationDefinition } from '@botpress/sdk'
import bluebird from 'bluebird'
import { ActionModule } from './action'
import { ChannelModule } from './channel'
import { ConfigurationModule } from './configuration'
import { GENERATED_HEADER, INDEX_FILE } from './const'
import { EventModule } from './event'
import { Module, ModuleDef, ReExportTypeModule } from './module'
import type * as types from './typings'

export class IntegrationImplementationIndexModule extends Module {
  public static async create(integration: IntegrationDefinition): Promise<IntegrationImplementationIndexModule> {
    const configModule = await ConfigurationModule.create(integration.configuration ?? { schema: {} })

    const actionsModule = await ActionsModule.create(integration.actions ?? {})
    actionsModule.unshift('actions')

    const channelsModule = await ChannelsModule.create(integration.channels ?? {})
    channelsModule.unshift('channels')

    const eventsModule = await EventsModule.create(integration.events ?? {})
    eventsModule.unshift('events')

    const { name, version } = integration
    const inst = new IntegrationImplementationIndexModule(
      configModule,
      actionsModule,
      channelsModule,
      eventsModule,
      { name, version },
      {
        path: INDEX_FILE,
        exportName: 'Integration',
        content: '',
      }
    )

    inst.pushDep(configModule)
    inst.pushDep(actionsModule)
    inst.pushDep(channelsModule)
    inst.pushDep(eventsModule)
    return inst
  }

  private constructor(
    private configModule: ConfigurationModule,
    private actionsModule: ActionsModule,
    private channelsModule: ChannelsModule,
    private eventsModule: EventsModule,
    private integrationID: { name: string; version: string },
    def: ModuleDef
  ) {
    super(def)
  }

  public override get content(): string {
    let content = GENERATED_HEADER

    const { configModule, actionsModule, channelsModule, eventsModule } = this

    content += 'import * as sdk from "@botpress/sdk";\n\n'

    const configImport = configModule.import(this)
    const actionsImport = actionsModule.import(this)
    const channelsImport = channelsModule.import(this)
    const eventsImport = eventsModule.import(this)

    content += `import type * as ${configModule.name} from "./${configImport}";\n`
    content += `import type * as ${actionsModule.name} from "./${actionsImport}";\n`
    content += `import type * as ${channelsModule.name} from "./${channelsImport}";\n`
    content += `import type * as ${eventsModule.name} from "./${eventsImport}";\n`
    content += `export * as ${configModule.name} from "./${configImport}";\n`
    content += `export * as ${actionsModule.name} from "./${actionsImport}";\n`
    content += `export * as ${channelsModule.name} from "./${channelsImport}";\n`
    content += `export * as ${eventsModule.name} from "./${eventsImport}";\n`

    content += '\n'

    content += `export class Integration
      extends sdk.Integration<${configModule.name}.${configModule.exports}, ${actionsModule.name}.${actionsModule.exports}, ${channelsModule.name}.${channelsModule.exports}, ${eventsModule.name}.${eventsModule.exports}> {}\n`

    content += `export type IntegrationProps = sdk.IntegrationProps<${configModule.name}.${configModule.exports}, ${actionsModule.name}.${actionsModule.exports}, ${channelsModule.name}.${channelsModule.exports}, ${eventsModule.name}.${eventsModule.exports}>;\n`

    return content
  }
}

class ChannelsModule extends ReExportTypeModule {
  public static async create(channels: Record<string, types.Channel>): Promise<ChannelsModule> {
    const channelModules = await bluebird.map(Object.entries(channels), async ([channelName, channel]) => {
      const mod = await ChannelModule.create(channelName, channel)
      return mod.unshift(channelName)
    })
    const inst = new ChannelsModule({ exportName: 'Channels' })
    inst.pushDep(...channelModules)
    return inst
  }
}

class ActionsModule extends ReExportTypeModule {
  public static async create(actions: Record<string, types.Action>): Promise<ActionsModule> {
    const actionModules = await bluebird.map(Object.entries(actions), async ([actionName, action]) => {
      const mod = await ActionModule.create(actionName, action)
      return mod.unshift(actionName)
    })

    const inst = new ActionsModule({
      exportName: 'Actions',
    })

    inst.pushDep(...actionModules)
    return inst
  }
}

class EventsModule extends ReExportTypeModule {
  public static async create(events: Record<string, types.Event>): Promise<EventsModule> {
    const eventModules = await bluebird.map(Object.entries(events), async ([eventName, event]) =>
      EventModule.create(eventName, event)
    )

    const inst = new EventsModule({
      exportName: 'Events',
    })
    inst.pushDep(...eventModules)
    return inst
  }
}
