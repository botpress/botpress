import * as sdk from 'botpress/sdk'
import crypto from 'crypto'
import _ from 'lodash'

import { TrainArtefacts, TrainInput, TrainOutput } from './engine2'

// TODO add hash ?
export interface Model {
  languageCode: string
  startedAt: Date
  finishedAt: Date
  success: boolean
  data: {
    input: TrainInput
    output?: TrainOutput
    artefacts?: TrainArtefacts
  }
}

const MODELS_DIR = './models'

function makeFileName(hash: string, lang: string): string {
  return `${hash}.${lang}.model`
}

// we might want to make this language specific
export function computeModelHash(intents: any, entities: any): string {
  return crypto
    .createHash('md5')
    .update(JSON.stringify({ intents, entities }))
    .digest('hex')
}

export function serializeModel(model: Model): string {
  // TODO use messagePack here
  return JSON.stringify({ ...model, data: _.omit(model.data, 'output') })
}

export function deserializeModel(str: string): Model {
  // TODO use messagePack here
  const model = JSON.parse(str) as Model
  model.data.artefacts.slots_model = Buffer.from(model.data.artefacts.slots_model)
  return model
}

export async function getModel(ghost: sdk.ScopedGhostService, hash: string, lang: string): Promise<Model | undefined> {
  const fname = makeFileName(hash, lang)
  if (await ghost.fileExists(MODELS_DIR, fname)) {
    const strMod = await ghost.readFileAsString(MODELS_DIR, fname)
    return deserializeModel(strMod)
  }
}

export async function saveModel(ghost: sdk.ScopedGhostService, model: Model, hash: string): Promise<void> {
  const serialized = serializeModel(model)
  const fname = makeFileName(hash, model.languageCode)
  return ghost.upsertFile(MODELS_DIR, fname, serialized)
}
