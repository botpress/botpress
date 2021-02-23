import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import ms from 'ms'
import { TrainingId } from './typings'

const TRAINING_MUTEX_DURATION = ms('5m')

interface TrainingHandle {
  id: TrainingId
  lock: sdk.RedisLock
}

export class LocalTrainingContainer {
  private _localTrainings: TrainingHandle[] = []

  constructor(private _distributed: typeof sdk.distributed) {}

  public length() {
    return this._localTrainings.length
  }

  public async isLocked(id: TrainingId): Promise<boolean> {
    const ressource = this._makeRessourceName(id)
    const lock = await this._distributed.acquireLock(ressource, ms('1s'))
    if (lock) {
      await lock.unlock()
      return false
    }
    return true
  }

  public async startLocalTraining(id: TrainingId) {
    const { botId, language } = id

    const ressource = this._makeRessourceName({ botId, language })
    const lock = await this._distributed.acquireLock(ressource, TRAINING_MUTEX_DURATION)
    if (!lock) {
      // this case should never happend
      throw new Error(
        `About to start local training ${ressource}, but it seems to be already handle by another worker.`
      )
    }

    this._localTrainings.push({
      id,
      lock
    })
  }

  public async rmLocalTraining(id: TrainingId) {
    const isTraining = (t: TrainingHandle) => this._areEqual(t.id, id)
    const handle = this._localTrainings.find(isTraining)
    await handle?.lock.unlock()

    this._localTrainings = this._localTrainings.filter(_.negate(isTraining))
  }

  public async refreshLocalTraining(id: TrainingId): Promise<void> {
    const isTraining = (t: TrainingHandle) => this._areEqual(t.id, id)
    const handle = this._localTrainings.find(isTraining)
    return handle?.lock.extend(TRAINING_MUTEX_DURATION)
  }

  private _areEqual(id1: TrainingId, id2: TrainingId) {
    return id1.botId === id2.botId && id1.language === id2.language
  }

  private _makeRessourceName(id: TrainingId) {
    return `${id.botId}:${id.language}`
  }
}
