import * as sdk from 'botpress/sdk'

type INLUCore = typeof sdk.NLUCore

export class NLUCore implements INLUCore {
  train = (input: sdk.NLUCore.TrainInput, onProgress: (progress: number) => void, onDone: (model: string) => void) => {
    return '123456'
  }

  load = (model: string, modelId: string) => {}

  predict = async (modelId: string, userInput: string) => {
    return {} as sdk.NLU.Predictions
  }

  getTrainingStatus = (modelId: string) => {
    return <sdk.NLUCore.TrainingStatus>'done'
  }

  cancelTraining = async (modelId: string) => {}
}
