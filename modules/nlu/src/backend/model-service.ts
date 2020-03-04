import * as sdk from 'botpress/sdk'
import crypto from 'crypto'
import _ from 'lodash'

import { TrainArtefacts, TrainInput, TrainOutput } from './training-pipeline'

export interface Model {
  hash: string
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
const MAX_MODELS_TO_KEEP = 2

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

function serializeModel(model: Model): string {
  return JSON.stringify(_.omit(model, ['data.output', 'data.input.trainingSession']))
}

function deserializeModel(str: string): Model {
  const model = JSON.parse(str) as Model
  model.data.artefacts.slots_model = Buffer.from(model.data.artefacts.slots_model)
  return model
}

async function pruneModels(ghost: sdk.ScopedGhostService, languageCode: string): Promise<void | void[]> {
  const models = await listModelsForLang(ghost, languageCode)
  if (models.length > MAX_MODELS_TO_KEEP) {
    return Promise.map(models.slice(MAX_MODELS_TO_KEEP), file => ghost.deleteFile(MODELS_DIR, file))
  }
}

async function listModelsForLang(ghost: sdk.ScopedGhostService, languageCode: string): Promise<string[]> {
  const endingPattern = makeFileName('*', languageCode)
  return await ghost.directoryListing(MODELS_DIR, endingPattern, undefined, undefined, {
    sortOrder: { column: 'modifiedOn', desc: true }
  })
}

export async function getModel(ghost: sdk.ScopedGhostService, hash: string, lang: string): Promise<Model | void> {
  const fname = makeFileName(hash, lang)
  if (await ghost.fileExists(MODELS_DIR, fname)) {
    const strMod = await ghost.readFileAsString(MODELS_DIR, fname)
    return deserializeModel(strMod)
  }
}

export async function getLatestModel(ghost: sdk.ScopedGhostService, lang: string): Promise<Model | void> {
  const availableModels = await listModelsForLang(ghost, lang)
  if (availableModels.length === 0) {
    return
  }
  return getModel(ghost, availableModels[0].split('.')[0], lang)
}

export async function saveModel(ghost: sdk.ScopedGhostService, model: Model, hash: string): Promise<void | void[]> {
  const serialized = serializeModel(model)
  const fname = makeFileName(hash, model.languageCode)
  await ghost.upsertFile(MODELS_DIR, fname, serialized)
  return pruneModels(ghost, model.languageCode)
}
