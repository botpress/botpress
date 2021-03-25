import * as sdk from 'botpress/sdk'
import * as NLU from 'common/nlu/engine'
import { TrainingQueue, TrainingQueueOptions } from './training-queue'
import { ITrainingRepository } from './training-repo'
import { TrainingId, TrainerService, TrainingListener } from './typings'

export class DistributedTrainingQueue extends TrainingQueue {
  private _broadcastCancelTraining: (id: TrainingId) => Promise<void>
  private _broadcastLoadModel: (botId: string, modelId: NLU.ModelId) => Promise<void>
  private _broadcastRunTask: () => Promise<void>

  constructor(
    _trainingRepo: ITrainingRepository,
    _errors: typeof NLU.errors,
    _logger: sdk.Logger,
    _trainerService: TrainerService,
    private _distributed: typeof sdk.distributed,
    _onChange: TrainingListener,
    options: Partial<TrainingQueueOptions> = {}
  ) {
    super(_trainingRepo, _errors, _logger, _trainerService, _onChange, options)
  }

  public async initialize() {
    await super.initialize()

    const localCancelTraining = (trainId: TrainingId) => super.cancelTraining(trainId)
    this._broadcastCancelTraining = await this._broadcastFrom(localCancelTraining)

    const localLoadModel = (botId: string, modelId: NLU.ModelId) => super.loadModel(botId, modelId)
    this._broadcastLoadModel = await this._broadcastFrom(localLoadModel)

    const localRunTask = () => super.runTask()
    this._broadcastRunTask = await this._broadcastFrom(localRunTask)
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

  protected loadModel(botId: string, modelId: NLU.ModelId) {
    return this._broadcastLoadModel(botId, modelId)
  }
}
