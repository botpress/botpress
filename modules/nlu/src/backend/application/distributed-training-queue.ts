import * as sdk from 'botpress/sdk'

import { ModelId } from '../stan/model-id-service'
import { TrainingQueue, TrainingQueueOptions } from './training-queue'
import { ITrainingRepository } from './training-repo'
import { TrainingId, TrainerService, TrainingListener } from './typings'

export class DistributedTrainingQueue extends TrainingQueue {
  private _broadcastCancelTraining: (id: TrainingId) => Promise<void>
  private _broadcastLoadModel: (botId: string, modelId: ModelId) => Promise<void>
  private _broadcastRunTask: () => Promise<void>

  constructor(
    _trainingRepo: ITrainingRepository,
    _logger: sdk.Logger,
    _trainerService: TrainerService,
    private _distributed: typeof sdk.distributed,
    _onChange: TrainingListener,
    options: Partial<TrainingQueueOptions> = {}
  ) {
    super(_trainingRepo, _logger, _trainerService, _onChange, options)
  }

  public async initialize() {
    await super.initialize()

    this._broadcastCancelTraining = await this._broadcastFrom(super.cancelTraining.bind(this))
    this._broadcastLoadModel = await this._broadcastFrom(super.loadModel.bind(this))
    this._broadcastRunTask = await this._broadcastFrom(super.runTask.bind(this))
  }

  private _broadcastFrom = async <T extends (...args: any[]) => any>(fn: T) => {
    const broadcasted = (await this._distributed.broadcast(fn)) as typeof fn
    return broadcasted
  }

  public cancelTraining(trainId: TrainingId) {
    return this._broadcastCancelTraining(trainId)
  }

  protected runTask() {
    return this._broadcastRunTask()
  }

  protected loadModel(botId: string, modelId: ModelId) {
    return this._broadcastLoadModel(botId, modelId)
  }
}
