import * as sdk from 'botpress/sdk'

import { createApi } from '../../../../api'
import { TrainDefinitions, DefinitionRepository, FileListener } from '../typings'

interface BotDefinition {
  botId: string
}

/**
 * TODO: keep a cache of definitions files in memory and invalidate cache onFileChange
 */
export class ScopedDefinitionsRepository implements DefinitionRepository {
  private _botId: string

  constructor(bot: BotDefinition, private _bp: typeof sdk) {
    this._botId = bot.botId
  }

  // TODO: when we bring back NLU module in core, use the actual repo, not an HTTP call
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
