import * as sdk from '@botpress/sdk'
import * as consts from './const'
import { IntegrationTypingsIndexModule } from './integration-typings'
import * as mapIntegration from './map-integration'
import { Module } from './module'

export class BotTypingsIndexModule extends Module {
  public static async create(bot: sdk.BotDefinition): Promise<BotTypingsIndexModule> {
    const inst = new BotTypingsIndexModule({
      content: [
        consts.GENERATED_HEADER,
        "import * as sdk from '@botpress/sdk'",
        '',
        'type TBot = {',
        '  integrations: Record<string, any>,',
        '  events: Record<string, any>,',
        '  states: Record<string, any>,',
        '}',
        '',
        'export class Bot extends sdk.Bot<TBot> {}',
      ].join('\n'),
      exportName: 'Bot',
      path: consts.INDEX_FILE,
    })

    for (const [alias, integration] of Object.entries(bot.integrations ?? {})) {
      const definition = mapIntegration.from.sdk(integration.definition)
      const integrationModule = await IntegrationTypingsIndexModule.create(definition)
      integrationModule.unshift(alias)
      inst.pushDep(integrationModule)
    }

    return inst
  }
}
