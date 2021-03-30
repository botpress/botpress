import * as sdk from 'botpress/sdk'
import { Model } from 'common/nlu/engine'
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

async function pruneModels(ghost: sdk.ScopedGhostService, languageCode: string): Promise<void | void[]> {
  const models = await listModelsForLang(ghost, languageCode)
  if (models.length > MAX_MODELS_TO_KEEP) {
    return Promise.map(models.slice(MAX_MODELS_TO_KEEP), file => ghost.deleteFile(MODELS_DIR, file))
  }
}

async function listModelsForLang(ghost: sdk.ScopedGhostService, languageCode: string): Promise<string[]> {
  const endingPattern = makeFileName('*', languageCode)
  return ghost.directoryListing(MODELS_DIR, endingPattern, undefined, undefined, {
    sortOrder: { column: 'modifiedOn', desc: true }
  })
}

async function getModel(ghost: sdk.ScopedGhostService, hash: string, lang: string): Promise<Model | undefined> {
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

async function saveModel(ghost: sdk.ScopedGhostService, model: Model, hash: string): Promise<void | void[]> {
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

const migration: sdk.ModuleMigration = {
  info: {
    description: 'Prune and compress old models',
    target: 'bot',
    type: 'content'
  },
  up: async ({ bp, metadata }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    let hasChanged = false
    const migrateModels = async (bot: sdk.BotConfig) => {
      const ghost = bp.ghost.forBot(bot.id)

      return Promise.mapSeries(bot.languages, async lang => {
        await pruneModels(ghost, lang)
        const modNames = await listModelsForLang(ghost, lang)

        return Promise.map(modNames, async mod => {
          try {
            const model: any = await ghost.readFileAsObject(MODELS_DIR, mod)
            if (!model.hash) {
              return ghost.deleteFile(MODELS_DIR, mod) // model is really outdated
            }
            hasChanged = true
            return saveModel(ghost, model, model.hash) // Triggers model compression
          } catch (err) {
            // model is probably an archive
            return
          }
        })
      })
    }

    if (!metadata.botId) {
      const bots = await bp.bots.getAllBots()
      await Promise.map(bots.values(), migrateModels)
    }

    return {
      success: true,
      message: hasChanged ? 'Model compression completed successfully' : 'Nothing to compress, skipping...'
    }
  },

  down: async ({ bp }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    bp.logger.warn(`No down migration written for ${path.basename(__filename)}`)
    return {
      success: true,
      message: 'No down migration written.'
    }
  }
}

export default migration
