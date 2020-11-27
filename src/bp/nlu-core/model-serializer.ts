import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { TrainInput, TrainOutput } from './training-pipeline'
import { Intent } from './typings'
import Utterance, { SerializedUtterance } from './utterance/utterance'

export type PredictableModel = Omit<sdk.NLU.Model, 'data'> & {
  data: {
    input: TrainInput
    output: TrainOutput
  }
}

export function serializeModel(model: PredictableModel): sdk.NLU.Model {
  const { hash, languageCode, startedAt, finishedAt, data, seed } = model

  const serialized: sdk.NLU.Model = {
    hash,
    languageCode,
    startedAt,
    finishedAt,
    seed,
    data: {
      input: '',
      output: ''
    }
  }

  serialized.data.input = JSON.stringify(data.input)
  serialized.data.output = JSON.stringify(data.output)

  return serialized
}

export function deserializeModel(serialized: sdk.NLU.Model): PredictableModel {
  const { hash, languageCode, startedAt, finishedAt, data, seed } = serialized

  const model: PredictableModel = {
    hash,
    languageCode,
    startedAt,
    finishedAt,
    seed,
    data: {
      input: JSON.parse(data.input),
      output: JSON.parse(data.output)
    }
  }
  model.data.output.slots_model = Buffer.from(model.data.output.slots_model)
  return model
}

export const serializeIntent = (intent: Intent<Utterance>): Intent<SerializedUtterance> => {
  return {
    ...intent,
    utterances: intent.utterances.map(u => u.serialize())
  }
}

export const deserializeIntent = (intent: Intent<SerializedUtterance>): Intent<Utterance> => {
  return {
    ...intent,
    utterances: intent.utterances.map(u => Utterance.fromSerial(u))
  }
}
