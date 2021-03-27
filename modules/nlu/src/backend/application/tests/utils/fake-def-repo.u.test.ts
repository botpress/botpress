import { ListenHandle, NLU } from 'botpress/sdk'

import {
  FileListener,
  IDefinitionsRepository,
  TrainDefinitions
} from '../../scoped/infrastructure/definitions-repository'

import './sdk.u.test'
import _ from 'lodash'

interface Definitions {
  intentDefs: NLU.IntentDefinition[]
  entityDefs: NLU.EntityDefinition[]
}

export class FakeDefinitionRepo implements IDefinitionsRepository {
  private _listeners: FileListener[] = []

  private intents: NLU.IntentDefinition[] = []
  private entities: NLU.EntityDefinition[] = []

  constructor(defs: Definitions) {
    const { intentDefs, entityDefs } = _.cloneDeep(defs)
    this.intents = intentDefs
    this.entities = entityDefs
  }

  async getTrainDefinitions(): Promise<TrainDefinitions> {
    return {
      entityDefs: [...this.entities],
      intentDefs: [...this.intents]
    }
  }

  public upsertEntity = (entity: NLU.EntityDefinition) => {
    const idx = this.entities.findIndex(i => i.name === entity.name)
    if (idx >= 0) {
      this.entities.splice(idx, 1)
    }
    this.entities.push(entity)
    return this._notify('entities', entity.name)
  }

  public upsertIntent = async (intent: NLU.IntentDefinition) => {
    const idx = this.intents.findIndex(i => i.name === intent.name)
    if (idx >= 0) {
      this.intents.splice(idx, 1)
    }
    this.intents.push(intent)
    return this._notify('intents', intent.name)
  }

  private async _notify(base: 'intents' | 'entities', objectName: string) {
    for (const l of this._listeners) {
      await l(`/${base}/${objectName}.json`)
    }
  }

  onFileChanged(listener: (filePath: string) => Promise<void>): ListenHandle {
    this._listeners.push(listener)
    return {
      remove: () => {}
    }
  }
}
