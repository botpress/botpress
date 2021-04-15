import _ from 'lodash'
import { Model } from '../typings'

import { TrainInput, TrainOutput } from './training-pipeline'

export type PredictableModel = Omit<Model, 'data'> & {
  data: {
    input: TrainInput
    output: TrainOutput
  }
}

export function serializeModel(model: PredictableModel): Model {
  const { id, startedAt, finishedAt, data } = model

  const serialized: Model = {
    id,
    startedAt,
    finishedAt,
    data: {
      input: '',
      output: ''
    }
  }

  serialized.data.input = JSON.stringify(data.input)
  serialized.data.output = JSON.stringify(data.output)

  return serialized
}

export function deserializeModel(serialized: Model): PredictableModel {
  const { id, startedAt, finishedAt, data } = serialized

  const model: PredictableModel = {
    id,
    startedAt,
    finishedAt,
    data: {
      input: JSON.parse(data.input),
      output: JSON.parse(data.output)
    }
  }
  return model
}
