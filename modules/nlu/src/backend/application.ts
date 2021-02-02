import * as sdk from 'botpress/sdk'
import { NLU } from 'botpress/sdk'
import _ from 'lodash'
import ms from 'ms'

import { Bot } from './bot'
import { BotNotMountedError } from './errors'
import TrainSessionService from './train-session-service'

const TRAIN_MUTEX_DURATION = ms('5m')

export class NLUApplication {
  private _bots: _.Dictionary<Bot> = {}

  private _broadcastLoadModel: (botId: string, modelId: NLU.ModelId) => Promise<void>
  private _broadcastCancelTraining: (botId: string, language: string) => Promise<void>

  constructor(
    private _bp: typeof sdk | undefined,
    private _engine: NLU.Engine,
    private _trainSessionService: TrainSessionService
  ) {}

  public async initialize() {
    const loadModel = (botId: string, modelId: NLU.ModelId) => {
      return this._bots[botId].load(modelId)
    }
    this._broadcastLoadModel = (await this._bp.distributed.broadcast(loadModel)) as typeof loadModel

    const cancelTraining = (botId: string, language: string) => {
      return this._bots[botId].cancelTraining(language)
    }
    this._broadcastCancelTraining = (await this._bp.distributed.broadcast(cancelTraining)) as typeof cancelTraining
  }

  public teardown = async () => {
    for (const botId of Object.keys(this._bots)) {
      await this.unmountBot(botId)
    }
  }

  public hasBot = (botId: string) => {
    return !!this._bots[botId]
  }

  public mountBot = async (botId: string) => {
    const { _bp, _engine, _trainSessionService } = this

    const bot = new Bot(botId, _bp, _engine, _trainSessionService)
    await bot.mount()
    this._bots[botId] = bot
  }

  public unmountBot = async (botId: string) => {
    const bot = this._bots[botId]
    if (!bot) {
      throw new BotNotMountedError(botId)
    }

    await this._bots[botId].unmount()
    delete this._bots[botId]
  }

  public async train(botId: string, language: string) {
    const { _bp, _trainSessionService } = this

    const bot = this._bots[botId]
    if (!bot) {
      throw new BotNotMountedError(botId)
    }

    const lock = await _bp.distributed.acquireLock(
      _trainSessionService.makeTrainSessionKey(botId, language),
      TRAIN_MUTEX_DURATION
    )
    if (!lock) {
      return
    }

    const trainSession = _trainSessionService.makeTrainingSession(botId, language)
    trainSession.status = 'training-pending'
    await _trainSessionService.setTrainingSession(botId, trainSession)

    try {
      const modelId = await bot.train(language, lock)
      await this._broadcastLoadModel(botId, modelId)
    } catch (err) {
      if (_bp.NLU.errors.isTrainingCanceled(err)) {
        _bp.logger.forBot(botId).info('Training cancelled')
        trainSession.status = 'needs-training'
        await _trainSessionService.setTrainingSession(botId, trainSession)
      } else if (_bp.NLU.errors.isTrainingAlreadyStarted(err)) {
        _bp.logger.forBot(botId).info('Training already started')
      } else {
        _bp.logger
          .forBot(botId)
          .attachError(err)
          .error('Training could not finish because of an unexpected error.')
        trainSession.status = 'needs-training'
        await _trainSessionService.setTrainingSession(botId, trainSession)
      }
    } finally {
      lock.unlock()
    }
  }

  public async cancelTraining(botId: string, language: string) {
    const bot = this._bots[botId]
    if (!bot) {
      throw new BotNotMountedError(botId)
    }

    return this._broadcastCancelTraining(botId, language)
  }

  public async predict(botId: string, inputText: string, anticipatedLanguage?: string) {
    const bot = this._bots[botId]
    if (!bot) {
      throw new BotNotMountedError(botId)
    }

    return this._bots[botId].predict(inputText, anticipatedLanguage)
  }
}
