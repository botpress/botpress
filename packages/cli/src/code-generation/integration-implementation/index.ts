import type { IntegrationDefinition } from '@botpress/sdk'
import { z } from 'zod'
import { GENERATED_HEADER, INDEX_FILE } from '../const'
import { Module, ModuleDef } from '../module'
import { ActionsModule } from './actions-ts-module'
import { ChannelsModule } from './channels-ts-module'
import { ConfigurationModule } from './configuration-ts-module'
import { EventsModule } from './events-ts-module'
import { StatesModule } from './states-ts-module'

export class IntegrationImplementationIndexModule extends Module {
  public static async create(integration: IntegrationDefinition): Promise<IntegrationImplementationIndexModule> {
    const configModule = await ConfigurationModule.create(integration.configuration ?? { schema: z.object({}) })

    const actionsModule = await ActionsModule.create(integration.actions ?? {})
    actionsModule.unshift('actions')

    const channelsModule = await ChannelsModule.create(integration.channels ?? {})
    channelsModule.unshift('channels')

    const eventsModule = await EventsModule.create(integration.events ?? {})
    eventsModule.unshift('events')

    const statesModule = await StatesModule.create(integration.states ?? {})
    statesModule.unshift('states')

    const inst = new IntegrationImplementationIndexModule(
      configModule,
      actionsModule,
      channelsModule,
      eventsModule,
      statesModule,
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
    inst.pushDep(statesModule)
    return inst
  }

  private constructor(
    private configModule: ConfigurationModule,
    private actionsModule: ActionsModule,
    private channelsModule: ChannelsModule,
    private eventsModule: EventsModule,
    private statesModule: StatesModule,
    def: ModuleDef
  ) {
    super(def)
  }

  public override get content(): string {
    let content = GENERATED_HEADER

    const { configModule, actionsModule, channelsModule, eventsModule, statesModule } = this

    const configImport = configModule.import(this)
    const actionsImport = actionsModule.import(this)
    const channelsImport = channelsModule.import(this)
    const eventsImport = eventsModule.import(this)
    const statesImport = statesModule.import(this)

    content += [
      GENERATED_HEADER,
      'import * as sdk from "@botpress/sdk"',
      '',
      `import type * as ${configModule.name} from "./${configImport}"`,
      `import type * as ${actionsModule.name} from "./${actionsImport}"`,
      `import type * as ${channelsModule.name} from "./${channelsImport}"`,
      `import type * as ${eventsModule.name} from "./${eventsImport}"`,
      `import type * as ${statesModule.name} from "./${statesImport}"`,
      `export * as ${configModule.name} from "./${configImport}"`,
      `export * as ${actionsModule.name} from "./${actionsImport}"`,
      `export * as ${channelsModule.name} from "./${channelsImport}"`,
      `export * as ${eventsModule.name} from "./${eventsImport}"`,
      `export * as ${statesModule.name} from "./${statesImport}"`,
      '',
      'type TIntegration = {',
      `  configuration: ${configModule.name}.${configModule.exports}`,
      `  actions: ${actionsModule.name}.${actionsModule.exports}`,
      `  channels: ${channelsModule.name}.${channelsModule.exports}`,
      `  events: ${eventsModule.name}.${eventsModule.exports}`,
      `  states: ${statesModule.name}.${statesModule.exports}`,
      '}',
      '',
      'export type IntegrationProps = sdk.IntegrationProps<TIntegration>',
      '',
      'export class Integration extends sdk.Integration<TIntegration> {}',
    ].join('\n')

    return content
  }
}
