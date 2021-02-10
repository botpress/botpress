import { ListenHandle, NLU } from 'botpress/sdk'

import { DefinitionRepository, FileListener, TrainDefinitions } from '../scoped/typings'

export class FakeDefinitionRepo implements DefinitionRepository {
  private _listeners: FileListener[] = []

  private intents: NLU.IntentDefinition[] = []
  private entities: NLU.EntityDefinition[] = []

  constructor() {}

  initialize(intents: NLU.IntentDefinition[], entities: NLU.EntityDefinition[]) {
    this.intents = [...intents]
    this.entities = [...entities]
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
    this._notify('entities', entity.name)
  }

  public upsertIntent = (intent: NLU.IntentDefinition) => {
    const idx = this.intents.findIndex(i => i.name === intent.name)
    if (idx >= 0) {
      this.intents.splice(idx, 1)
    }
    this.intents.push(intent)
    this._notify('intents', intent.name)
  }

  private _notify(base: 'intents' | 'entities', objectName: string) {
    for (const l of this._listeners) {
      // tslint:disable-next-line: no-floating-promises
      l(`/${base}/${objectName}.json`)
    }
  }

  onFileChanged(listener: (filePath: string) => Promise<void>): ListenHandle {
    this._listeners.push(listener)
    return {
      remove: () => {}
    }
  }
}

test(__filename, () => {})
