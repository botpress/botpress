import * as sdk from 'botpress/sdk'
import crypto from 'crypto'
import fse, { WriteStream } from 'fs-extra'
import _ from 'lodash'
import path from 'path'
import { Stream } from 'stream'
import tar from 'tar'
import tmp from 'tmp'

export interface Model {
  hash: string
  startedAt: Date
  finishedAt: Date
  success: boolean
  data: any
}

export const MODELS_DIR = './models'
const MAX_MODELS_TO_KEEP = 2

function makeFileName(hash: string): string {
  return `${hash}.ndu.model`
}

export async function pruneModels(ghost: sdk.ScopedGhostService): Promise<void | void[]> {
  const models = await listModels(ghost)
  if (models.length > MAX_MODELS_TO_KEEP) {
    return Promise.map(models.slice(MAX_MODELS_TO_KEEP), file => ghost.deleteFile(MODELS_DIR, file))
  }
}

export async function listModels(ghost: sdk.ScopedGhostService): Promise<string[]> {
  return ghost.directoryListing(MODELS_DIR, '*', undefined, undefined, {
    sortOrder: { column: 'modifiedOn', desc: true }
  })
}

export async function getModel(ghost: sdk.ScopedGhostService, hash: string): Promise<Model | undefined> {
  const fileName = makeFileName(hash)
  if (!(await ghost.fileExists(MODELS_DIR, fileName))) {
    return
  }
  const buffStream = new Stream.PassThrough()
  buffStream.end(await ghost.readFileAsBuffer(MODELS_DIR, fileName))
  const tmpDir = tmp.dirSync({ unsafeCleanup: true })

  const tarStream = tar.x({ cwd: tmpDir.name, strict: true }, ['model']) as WriteStream
  buffStream.pipe(tarStream)
  await new Promise(resolve => tarStream.on('close', resolve))

  const modelBuff = await fse.readFile(path.join(tmpDir.name, 'model'))
  let mod
  try {
    mod = JSON.parse(modelBuff.toString())
  } catch (err) {
    await ghost.deleteFile(MODELS_DIR, fileName)
  } finally {
    tmpDir.removeCallback()
    return mod
  }
}

export async function getLatestModel(ghost: sdk.ScopedGhostService): Promise<Model | void> {
  const availableModels = await listModels(ghost)
  if (availableModels.length === 0) {
    return
  }
  return getModel(ghost, availableModels[0].split('.')[0])
}

export async function saveModel(ghost: sdk.ScopedGhostService, model: Model, hash: string): Promise<void | void[]> {
  const modelName = makeFileName(hash)
  const tmpDir = tmp.dirSync({ unsafeCleanup: true })
  const tmpFileName = path.join(tmpDir.name, 'model')
  await fse.writeFile(tmpFileName, JSON.stringify(model))

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
  return pruneModels(ghost)
}
