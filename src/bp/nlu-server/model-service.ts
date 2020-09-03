import { NLU } from 'botpress/sdk'
import crypto from 'crypto'
import fse, { WriteStream } from 'fs-extra'
import _ from 'lodash'
import path from 'path'
import { Stream } from 'stream'
import tar from 'tar'
import tmp from 'tmp'

export default class ModelService {
  constructor(private modelDir: string) {}

  public async init() {
    const modelDirExists = fse.existsSync(this.modelDir)
    if (!modelDirExists) {
      await fse.mkdir(this.modelDir)
    }
  }

  public async getModel(modelId: string, password: string): Promise<NLU.Model | undefined> {
    const { modelDir } = this

    const fname = this.makeFileName(modelId, password)
    const fpath = path.join(modelDir, fname)
    if (!fse.existsSync(fpath)) {
      return
    }
    const buffStream = new Stream.PassThrough()
    buffStream.end(await fse.readFile(fpath))
    const tmpDir = tmp.dirSync({ unsafeCleanup: true })

    const tarStream = tar.x({ cwd: tmpDir.name, strict: true }, ['model']) as WriteStream
    buffStream.pipe(tarStream)
    await new Promise(resolve => tarStream.on('close', resolve))

    const modelBuff = await fse.readFile(path.join(tmpDir.name, 'model'))
    let mod
    try {
      mod = JSON.parse(modelBuff.toString())
    } catch (err) {
      await fse.remove(fpath)
    } finally {
      tmpDir.removeCallback()
      return mod
    }
  }

  public async saveModel(model: NLU.Model, modelId: string, password: string): Promise<void> {
    const { modelDir } = this

    const serialized = JSON.stringify(model)

    const modelName = this.makeFileName(modelId, password)
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
    const fpath = path.join(modelDir, modelName)
    await fse.writeFile(fpath, buffer)
    tmpDir.removeCallback()
  }

  public makeModelId(hash: string, languageCode: string, seed: number) {
    return `${hash}.${languageCode}.${seed}`
  }

  private makeFileName(modelId: string, password: string): string {
    const fname = crypto
      .createHash('md5')
      .update(JSON.stringify({ modelId, password }))
      .digest('hex')

    return `${fname}.model`
  }
}
