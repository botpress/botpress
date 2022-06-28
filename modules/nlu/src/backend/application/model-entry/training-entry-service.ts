import { ModelEntryRepository } from './model-entry-repo'
import { ModelEntry, ModelKey } from './typings'

type TrainKey = ModelKey
type TrainEntry = ModelEntry
const status = 'not-ready'

/**
 * Maps a pair [botId, lang] to [modelId, defHash] during training
 * If studio was single node, this information would be kept in memory
 */
export class TrainingEntryService {
  constructor(private _modelStateRepo: ModelEntryRepository) {}

  public get(key: TrainKey): Promise<TrainEntry | undefined> {
    return this._modelStateRepo.get({ ...key, status })
  }

  public set(model: TrainEntry) {
    return this._modelStateRepo.set({ ...model, status })
  }

  public has(key: TrainEntry): Promise<boolean> {
    return this._modelStateRepo.has({ ...key, status })
  }

  public del(key: TrainKey): Promise<void> {
    return this._modelStateRepo.del({ ...key, status })
  }
}
