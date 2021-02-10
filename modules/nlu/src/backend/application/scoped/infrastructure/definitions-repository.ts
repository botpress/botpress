import * as sdk from 'botpress/sdk'

import { createApi } from '../../../../api'

interface TrainDefinitions {
  intentDefs: sdk.NLU.IntentDefinition[]
  entityDefs: sdk.NLU.EntityDefinition[]
}

interface BotDefinition {
  botId: string
}

export class ScopedDefinitionsRepository {
  private _botId: string

  constructor(bot: BotDefinition, private _bp: typeof sdk) {
    this._botId = bot.botId
  }

  async getTrainDefinitions(): Promise<TrainDefinitions> {
    const nluRepository = await createApi(this._bp, this._botId)
    const intentDefs = await nluRepository.fetchIntentsWithQNAs()
    const entityDefs = await nluRepository.fetchEntities()

    return {
      intentDefs,
      entityDefs
    }
  }
}
