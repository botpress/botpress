import * as sdk from 'botpress/sdk'

import { createApi } from '../../api'

export type FileListener = (fileName: string) => Promise<void>

export interface TrainDefinitions {
  intentDefs: sdk.NLU.IntentDefinition[]
  entityDefs: sdk.NLU.EntityDefinition[]
}

export class DefinitionsRepository {
  constructor(private _bp: typeof sdk) {}

  // TODO: use the actual repo with the ghost, not an HTTP call
  public async getTrainDefinitions(botId: string): Promise<TrainDefinitions> {
    const nluRepository = await createApi(this._bp, botId)
    const intentDefs = await nluRepository.fetchIntentsWithQNAs()
    const entityDefs = await nluRepository.fetchEntities()

    return {
      intentDefs,
      entityDefs
    }
  }

  public onFileChanged(botId: string, listener: FileListener): sdk.ListenHandle {
    const handle = this._bp.ghost.forBot(botId).onFileChanged(listener)
    return handle
  }
}
