import fse from 'fs-extra'
import glob from 'glob'
import stream from 'stream'
import tar from 'tar'
import { VError } from 'verror'

import { forceForwardSlashes } from './utils'

export const extractArchive = async (archive: Buffer, destination: string): Promise<string[]> => {
  try {
    if (!fse.existsSync(destination)) {
      fse.mkdirSync(destination)
    }
    const buffStream = new stream.PassThrough()
    const tarWriteStream = tar.x({ sync: true, strict: true, cwd: destination })

    buffStream.end(archive)
    buffStream.pipe(tarWriteStream)

    await new Promise((resolve, reject) => {
      tarWriteStream.on('end', resolve)
      tarWriteStream.on('error', reject)
    })

    const files = await Promise.fromCallback<string[]>(cb => glob('**/*.*', { cwd: destination }, cb))
    return files.map(filePath => forceForwardSlashes(filePath))
  } catch (err) {
    throw new VError(err, `[Archive] Error extracting archive to "${destination}"`)
  }
}

export const createArchive = async (fileName: string, folder: string, files: string[]): Promise<string> => {
  try {
    await tar.create(
      {
        cwd: folder,
        file: fileName,
        portable: true,
        gzip: true
      },
      files
    )
    return fileName
  } catch (err) {
    throw new VError(err, `[Archive] Error creating archive "${fileName}"`)
  }
}
