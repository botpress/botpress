import type { IntegrationDefinition } from '@botpress/sdk'
import { z } from 'zod'
import { GENERATED_HEADER, INDEX_FILE } from '../const'
import { Module, ModuleDef } from '../module'
import { ActionsModule } from './actions-ts-module'
import { ChannelsModule } from './channels-ts-module'
import { ConfigurationModule } from './configuration-ts-module'
import { EventsModule } from './events-ts-module'

export class IntegrationImplementationIndexModule extends Module {
  public static async create(integration: IntegrationDefinition): Promise<IntegrationImplementationIndexModule> {
    const configModule = await ConfigurationModule.create(integration.configuration ?? { schema: z.object({}) })

    const actionsModule = await ActionsModule.create(integration.actions ?? {})
    actionsModule.unshift('actions')

    const channelsModule = await ChannelsModule.create(integration.channels ?? {})
    channelsModule.unshift('channels')

    const eventsModule = await EventsModule.create(integration.events ?? {})
    eventsModule.unshift('events')

    const inst = new IntegrationImplementationIndexModule(configModule, actionsModule, channelsModule, eventsModule, {
      path: INDEX_FILE,
      exportName: 'Integration',
      content: '',
    })

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
