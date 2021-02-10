import * as sdk from 'botpress/sdk'
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
  private _done: TrainingList = new TrainingList()

  constructor(private _errors: typeof NLU.errors, private _socket: TrainSessionSocket, private _logger: sdk.Logger) {}

  async initialize() {
    this.consumerHandle = setInterval(this._runTask, JOB_INTERVAL)
  }

  async teardown() {
    clearInterval(this.consumerHandle)
    this._pending.clear()
    this._done.clear()

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

    if (this._done.has(trainId)) {
      this._done.rm(trainId)
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

    if (this._training.has(trainId)) {
      return // do not queue training if currently training
    }

    if (this._done.has(trainId)) {
      this._done.rm(trainId)
    }

    this._pending.queue({ language, botId, trainer, progress: 0 })
    await this._socket(botId, {
      key: this._makeKey({ botId, language }),
      language,
      progress: 0,
      status: 'training-pending'
    })
  }

  async cancelTraining(trainId: TrainingId): Promise<void> {
    const { language, botId } = trainId
    await this._socket(botId, {
      key: this._makeKey({ botId, language }),
      language,
      progress: 0,
      status: 'canceled'
    })

    if (this._pending.has(trainId)) {
      this._pending.rm(trainId)
    } else if (this._training.has(trainId)) {
      const { language, trainer } = this._training.rm(trainId)!
      await trainer.cancelTraining(language)
    }

    await this._socket(botId, {
      key: this._makeKey({ botId, language }),
      language,
      progress: 0,
      status: 'needs-training'
    })
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

    if (this._done.has(trainId)) {
      return {
        key,
        language,
        progress: 1,
        status: 'done'
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

  private _runTask = async () => {
    if (this._training.length() >= MAX_ALLOWED_TRAINING_PER_NODE) {
      return
    }

    if (this._pending.length() <= 0) {
      return
    }

    const next = this._pending.pop()!
    this._training.queue(next)

    // floating promise to return fast from task
    this._train(next)
  }

  private _train = async (queueElement: QueueElement) => {
    const { trainer, language, botId } = queueElement

    const key = this._makeKey({ botId, language })

    try {
      await trainer.train(language, async (progress: number) => {
        this._training.progress({ botId, language }, progress)

        await this._socket(botId, {
          key,
          language,
          progress,
          status: 'training'
        })
      })

      await this._socket(botId, {
        key,
        language,
        progress: 1,
        status: 'done'
      })

      await trainer.loadLatest(language)

      const done = this._training.rm({ botId, language })!
      this._done.queue(done)
    } catch (err) {
      if (this._errors.isTrainingCanceled(err)) {
        this._logger.forBot(botId).info('Training cancelled')
        this._training.rm({ botId, language })
        await this._socket(botId, {
          key,
          language,
          progress: 0,
          status: 'needs-training'
        })
      } else if (this._errors.isTrainingAlreadyStarted(err)) {
        this._logger.forBot(botId).info('Training already started')
      } else {
        this._logger
          .forBot(botId)
          .attachError(err)
          .error('Training could not finish because of an unexpected error.')
        this._training.rm({ botId, language })
        await this._socket(botId, {
          key,
          language,
          progress: 0,
          status: 'errored'
        })
      }
    }
  }
}
