import { NLU } from 'botpress/sdk'
import fse, { WriteStream } from 'fs-extra'
import _ from 'lodash'
import path from 'path'
import { Stream } from 'stream'
import tar from 'tar'
import tmp from 'tmp'

import NLUServerGhost from './ghost'

export default class ModelService {
  constructor(private ghost: NLUServerGhost, private modelDir: string) {}

  public async createModelDirIfNotExist() {
    const modelDirExists = await this.ghost.dirExists(this.modelDir)
    if (!modelDirExists) {
      await this.ghost.createDir(this.modelDir)
    }
  }

  public async getModel(modelId: string): Promise<NLU.Model | undefined> {
    const { ghost, modelDir } = this

    const fname = this.makeFileName(modelId)
    if (!(await ghost.fileExists(modelDir, fname))) {
      return
    }
    const buffStream = new Stream.PassThrough()
    buffStream.end(await ghost.readFileAsBuffer(modelDir, fname))
    const tmpDir = tmp.dirSync({ unsafeCleanup: true })

    const tarStream = tar.x({ cwd: tmpDir.name, strict: true }, ['model']) as WriteStream
    buffStream.pipe(tarStream)
    await new Promise(resolve => tarStream.on('close', resolve))

    const modelBuff = await fse.readFile(path.join(tmpDir.name, 'model'))
    let mod
    try {
      mod = JSON.parse(modelBuff.toString())
    } catch (err) {
      await ghost.deleteFile(modelDir, fname)
    } finally {
      tmpDir.removeCallback()
      return mod
    }
  }

  public async saveModel(model: NLU.Model): Promise<string> {
    const { ghost, modelDir } = this

    const serialized = JSON.stringify(model)

    const modelId = this.makeModelId(model)
    const modelName = this.makeFileName(modelId)
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
    await ghost.upsertFile(modelDir, modelName, buffer)
    tmpDir.removeCallback()

    return modelId
  }

  private makeModelId(model: NLU.Model) {
    return `${model.hash}.${model.languageCode}`
  }

  private makeFileName(modelId: string): string {
    return `${modelId}.model`
  }
}
