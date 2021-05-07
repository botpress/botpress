import fse from 'fs-extra'
import glob from 'glob'
import mkdirp from 'mkdirp'
import path from 'path'
import stream from 'stream'
import tar from 'tar'
import tmp from 'tmp'
import unzipper from 'unzipper'
import { VError } from 'verror'

import { forceForwardSlashes } from './utils'

// Source: https://github.com/kevva/is-zip
const isZip = buf => {
  if (!buf || buf.length < 4) {
    return false
  }

  return (
    buf[0] === 0x50 &&
    buf[1] === 0x4b &&
    (buf[2] === 0x03 || buf[2] === 0x05 || buf[2] === 0x07) &&
    (buf[3] === 0x04 || buf[3] === 0x06 || buf[3] === 0x08)
  )
}

export const extractArchive = async (archive: Buffer, destination: string): Promise<string[]> => {
  try {
    if (!(await fse.pathExists(destination))) {
      await mkdirp(destination)
    }

    const buffStream = new stream.PassThrough()
    buffStream.end(archive)

    let writeStream
    if (isZip(archive)) {
      writeStream = unzipper.Extract({ path: destination })
    } else {
      writeStream = tar.extract({ strict: true, cwd: destination })
    }

    buffStream.pipe(writeStream)

    await new Promise((resolve, reject) => {
      writeStream.on('close', resolve) // emitted by unzipper
      writeStream.on('end', resolve) // emitted by tar
      writeStream.on('error', reject)
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

export const createArchiveFromFolder = async (folder: string, ignoredFiles: string[]): Promise<Buffer> => {
  const tmpDir = tmp.dirSync({ unsafeCleanup: true })

  try {
    const files: string[] = await Promise.fromCallback(cb =>
      glob('**/*', { cwd: folder, ignore: ignoredFiles, nodir: true, dot: true }, cb)
    )

    for (const file of files) {
      await mkdirp(path.dirname(path.join(tmpDir.name, file)))
      await fse.copyFile(path.resolve(folder, file), path.resolve(tmpDir.name, file))
    }

    const filename = path.join(tmpDir.name, 'archive.tgz')
    const archive = await createArchive(filename, tmpDir.name, files)
    return await fse.readFile(archive)
  } finally {
    tmpDir.removeCallback()
  }
}
