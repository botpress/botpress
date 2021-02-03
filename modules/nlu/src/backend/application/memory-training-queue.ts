import { NLU } from 'botpress/sdk'
import ms from 'ms'

import { Trainer, TrainingId, TrainingQueue } from './typings'

const JOB_INTERVAL = ms('2s')

const MAX_ALLOWED_TRAINING_PER_NODE = 2 // make this configurable with module config

type TrainSessionSocket = (botId: string, ts: NLU.TrainingSession) => Promise<void>

interface QueueElement {
  botId: string
  language: string
  progress: number
  trainer: Trainer
}

class TrainingList {
  private _list: QueueElement[] = []

  public length() {
    return this._list.length
  }

  public elements() {
    return [...this._list]
  }

  public pop() {
    return this._list.pop()
  }

  public clear() {
    this._list.splice(0, this._list.length)
  }

  public has(trainId: TrainingId): boolean {
    const el = this.get(trainId)
    return !!el
  }

  public rm(trainId: TrainingId): QueueElement | undefined {
    const idx = this._getIdx(trainId)
    if (idx < 0) {
      return
    }
    const [el] = this._list.splice(idx, 1)
    return el
  }

  public queue(el: QueueElement) {
    this._list.unshift(el)
  }

  public progress(trainId: TrainingId, progress: number) {
    const el = this.get(trainId)
    if (!el) {
      return
    }
    el.progress = progress
  }

  public get(trainId: TrainingId): QueueElement | undefined {
    const idx = this._getIdx(trainId)
    if (idx < 0) {
      return
    }
    return this._list[idx]
  }

  private _getIdx(trainId: TrainingId): number {
    return this._list.findIndex(el => this._isEqual(el, trainId))
  }

  private _isEqual = (trainId1: TrainingId, trainId2: TrainingId) => {
    return trainId1.botId === trainId2.botId && trainId1.language === trainId2.language
  }
}

export class InMemoryTrainingQueue implements TrainingQueue {
  private consumerHandle: NodeJS.Timeout

  private _pending: TrainingList = new TrainingList()
  private _training: TrainingList = new TrainingList()

  constructor(private _socket: TrainSessionSocket) {}

  async initialize() {
    this.consumerHandle = setInterval(this._runTask, JOB_INTERVAL)
  }

  async teardown() {
    clearInterval(this.consumerHandle)
    this._pending.clear()

    for (const el of this._training.elements()) {
      const { language, trainer } = el
      await trainer.cancelTraining(language)
    }
    this._training.clear()
  }

  async needsTraining(trainId: TrainingId): Promise<void> {
    const { botId, language } = trainId

    if (this._training.has(trainId)) {
      return // do not notify socket if currently training
    }

    await this._socket(botId, {
      key: this._makeKey({ botId, language }),
      language,
      progress: 0,
      status: 'needs-training'
    })
  }

  async queueTraining(trainId: TrainingId, trainer: Trainer): Promise<void> {
    const { language, botId } = trainId
    this._pending.queue({ language, botId, trainer, progress: 0 })
  }

  async cancelTraining(trainId: TrainingId): Promise<void> {
    if (this._pending.has(trainId)) {
      this._pending.rm(trainId)
      return
    }

    if (this._training.has(trainId)) {
      const { language, trainer } = this._training.rm(trainId)!
      await trainer.cancelTraining(language)
    }
  }

  async getTraining(trainId: TrainingId): Promise<NLU.TrainingSession> {
    const { botId, language } = trainId

    const key = this._makeKey({ botId, language })

    if (this._training.has(trainId)) {
      const { progress } = this._training.get(trainId)!
      return {
        key,
        language,
        progress,
        status: 'training'
      }
    }

    const status: NLU.TrainingStatus = this._pending.has(trainId) ? 'training-pending' : 'needs-training'

    return {
      key,
      language,
      progress: 0,
      status
    }
  }

  private _makeKey = (trainId: TrainingId) => {
    const { botId, language } = trainId
    return `training:${botId}:${language}`
  }

  private _runTask = () => {
    if (this._training.length() >= MAX_ALLOWED_TRAINING_PER_NODE) {
      return
    }

    if (this._pending.length() <= 0) {
      return
    }

    const next = this._pending.pop()!
    this._training.queue(next)

    const { trainer, language, botId } = next

    trainer.train(language, (progress: number) => {
      this._training.progress({ botId, language }, progress)
    })
  }
}
