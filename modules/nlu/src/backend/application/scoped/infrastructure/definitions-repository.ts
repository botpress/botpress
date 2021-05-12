import * as sdk from 'botpress/sdk'

import { createApi } from '../../../../api'
import { I } from '../../typings'

interface BotDefinition {
  botId: string
}

export type FileListener = (fileName: string) => Promise<void>
export type IDefinitionsRepository = I<ScopedDefinitionsRepository>

export interface TrainDefinitions {
  intentDefs: sdk.NLU.IntentDefinition[]
  entityDefs: sdk.NLU.EntityDefinition[]
}

export class ScopedDefinitionsRepository {
  private _botId: string

  constructor(bot: BotDefinition, private _bp: typeof sdk) {
    this._botId = bot.botId
  }

  // TODO: use the actual repo with the ghost, not an HTTP call
  public async getTrainDefinitions(): Promise<TrainDefinitions> {
    const nluRepository = await createApi(this._bp, this._botId)
    const intentDefs = await nluRepository.fetchIntentsWithQNAs()
    const entityDefs = await nluRepository.fetchEntities()

    return {
      intentDefs,
      entityDefs
    }
  }

  public onFileChanged(listener: FileListener): sdk.ListenHandle {
    const handle = this._bp.ghost.forBot(this._botId).onFileChanged(listener)
    return handle
  }
}
