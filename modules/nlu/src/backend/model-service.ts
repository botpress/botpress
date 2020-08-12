import * as sdk from 'botpress/sdk'
import fse, { WriteStream } from 'fs-extra'
import _ from 'lodash'
import path from 'path'
import { Stream } from 'stream'
import tar from 'tar'
import tmp from 'tmp'

export const MODELS_DIR = './models'
const MAX_MODELS_TO_KEEP = 2

function makeFileName(hash: string, lang: string): string {
  return `${hash}.${lang}.model`
}

export async function pruneModels(ghost: sdk.ScopedGhostService, languageCode: string): Promise<void | void[]> {
  const models = await listModelsForLang(ghost, languageCode)
  if (models.length > MAX_MODELS_TO_KEEP) {
    return Promise.map(models.slice(MAX_MODELS_TO_KEEP), file => ghost.deleteFile(MODELS_DIR, file))
  }
}

export async function listModelsForLang(ghost: sdk.ScopedGhostService, languageCode: string): Promise<string[]> {
  const endingPattern = makeFileName('*', languageCode)
  return ghost.directoryListing(MODELS_DIR, endingPattern, undefined, undefined, {
    sortOrder: { column: 'modifiedOn', desc: true }
  })
}

export async function getModel(
  ghost: sdk.ScopedGhostService,
  hash: string,
  lang: string
): Promise<sdk.NLU.Model | undefined> {
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
    mod = JSON.parse(modelBuff.toString())
  } catch (err) {
    await ghost.deleteFile(MODELS_DIR, fname)
  } finally {
    tmpDir.removeCallback()
    return mod
  }
}

export async function getLatestModel(ghost: sdk.ScopedGhostService, lang: string): Promise<sdk.NLU.Model | undefined> {
  const availableModels = await listModelsForLang(ghost, lang)
  if (availableModels.length === 0) {
    return
  }
  return getModel(ghost, availableModels[0].split('.')[0], lang)
}

export async function saveModel(
  ghost: sdk.ScopedGhostService,
  model: sdk.NLU.Model,
  hash: string
): Promise<void | void[]> {
  const serialized = JSON.stringify(model)
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
