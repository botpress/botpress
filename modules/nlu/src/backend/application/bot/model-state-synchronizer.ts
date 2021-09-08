import { TrainingState as StanTrainingState } from '@botpress/nlu-client'
import { DirtyableModelState, ModelStateService } from '../model-state'
import { NLUClientWrapper } from '../nlu-client'
import { BotDefinition } from '../typings'

export type RemoteLocalState = Partial<{
  local: DirtyableModelState
  remote: StanTrainingState
}>

export class ModelStateSynchronizer {
  private _botId: string

  constructor(
    botDef: BotDefinition,
    private _nluClient: NLUClientWrapper,
    private _modelStateService: ModelStateService
  ) {
    this._botId = botDef.botId
  }

  public getModelState = async (language: string) => {
    const botId = this._botId

    const local = await this._modelStateService.get({ botId, language, statusType: 'ready' })
    if (!local) {
      return undefined
    }

    const remote = await this._nluClient.getTraining(this._botId, local.modelId)
    await this.updateLocalModelState(language, remote)
    if (!remote) {
      return
    }

    const { modelId, isDirty } = local
    return { ...remote, modelId, isDirty }
  }

  public getTrainingState = async (language: string) => {
    const botId = this._botId

    const local = await this._modelStateService.get({ botId, language, statusType: 'not-ready' })
    if (!local) {
      return undefined
    }

    const remote = await this._nluClient.getTraining(this._botId, local.modelId)
    await this.updateLocalTrainingState(language, remote)
    if (!remote) {
      return
    }

    const { modelId, isDirty } = local
    return { ...remote, modelId, isDirty }
  }

  public updateLocalModelState = async (language: string, remoteModelState: StanTrainingState | undefined) => {
    const botId = this._botId
    if (!remoteModelState || remoteModelState.status !== 'done') {
      await this._modelStateService.delete({ botId, language, statusType: 'ready' })
    }
  }

  public updateLocalTrainingState = async (language: string, remoteTrainingState: StanTrainingState | undefined) => {
    const botId = this._botId

    if (!remoteTrainingState) {
      return this._modelStateService.delete({ botId, language, statusType: 'not-ready' })
    }

    if (remoteTrainingState.status === 'training-pending' || remoteTrainingState.status === 'training') {
      const { status, progress } = remoteTrainingState
      return this._modelStateService.update({ botId, language, statusType: 'not-ready', status, progress })
    }

    if (remoteTrainingState.status === 'done') {
      return this._modelStateService.setReady({ botId, language, status: 'done', progress: 1 })
    }

    if (remoteTrainingState.status === 'errored' && remoteTrainingState.error?.type === 'already-started') {
      return
    }

    return this._modelStateService.delete({ botId, language, statusType: 'not-ready' })
  }
}
