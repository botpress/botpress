import * as sdk from 'botpress/sdk'
import crypto from 'crypto'
import fse, { WriteStream } from 'fs-extra'
import _ from 'lodash'
import path from 'path'
import { Stream } from 'stream'
import tar from 'tar'
import tmp from 'tmp'

import { TrainArtefacts, TrainInput, TrainOutput } from './training-pipeline'
import { EntityCache } from './typings'

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

export const MODELS_DIR = './models'
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

function serializeModel(ref: Model): string {
  const model = _.cloneDeep(ref)
  for (const entity of model.data.artefacts.list_entities) {
    entity.cache = (<EntityCache>entity.cache)?.dump() ?? []
  }
  return JSON.stringify(_.omit(model, ['data.output', 'data.input.trainingSession']))
}

function deserializeModel(str: string): Model {
  const model = JSON.parse(str) as Model
  model.data.artefacts.slots_model = Buffer.from(model.data.artefacts.slots_model)
  return model
}

export async function pruneModels(ghost: sdk.ScopedGhostService, languageCode: string): Promise<void | void[]> {
  const models = await listModelsForLang(ghost, languageCode)
  if (models.length > MAX_MODELS_TO_KEEP) {
    return Promise.map(models.slice(MAX_MODELS_TO_KEEP), file => ghost.deleteFile(MODELS_DIR, file))
  }
}

export async function listModelsForLang(ghost: sdk.ScopedGhostService, languageCode: string): Promise<string[]> {
  const endingPattern = makeFileName('*', languageCode)
  return await ghost.directoryListing(MODELS_DIR, endingPattern, undefined, undefined, {
    sortOrder: { column: 'modifiedOn', desc: true }
  })
}

export async function getModel(ghost: sdk.ScopedGhostService, hash: string, lang: string): Promise<Model | undefined> {
  const fname = makeFileName(hash, lang)
  if (!(await ghost.fileExists(MODELS_DIR, fname))) {
    return
  }
  const buffStream = new Stream.PassThrough()
  buffStream.end(await ghost.readFileAsBuffer(MODELS_DIR, fname))
  const tmpDir = tmp.dirSync({ unsafeCleanup: true })

  const tarStream = tar.x({ cwd: tmpDir.name, strict: true }, ['model']) as WriteStream
  buffStream.pipe(tarStream)
  await new Promise(resolve => tarStream.on('close', resolve))

  const modelBuff = await fse.readFile(path.join(tmpDir.name, 'model'))
  let mod
  try {
    mod = deserializeModel(modelBuff.toString())
  } catch (err) {
    await ghost.deleteFile(MODELS_DIR, fname)
  } finally {
    tmpDir.removeCallback()
    return mod
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
  const modelName = makeFileName(hash, model.languageCode)
  const tmpDir = tmp.dirSync({ unsafeCleanup: true })
  const tmpFileName = path.join(tmpDir.name, 'model')
  await fse.writeFile(tmpFileName, serialized)

  const archiveName = path.join(tmpDir.name, modelName)
  await tar.create(
    {
      file: archiveName,
      cwd: tmpDir.name,
      portable: true,
      gzip: true
    },
    ['model']
  )
  const buffer = await fse.readFile(archiveName)
  await ghost.upsertFile(MODELS_DIR, modelName, buffer)
  tmpDir.removeCallback()
  return pruneModels(ghost, model.languageCode)
}
