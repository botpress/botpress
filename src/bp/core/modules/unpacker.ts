import { Logger } from 'botpress/sdk'
import { TYPES } from 'core/types'
import crypto from 'crypto'
import fs from 'fs'
import fse from 'fs-extra'
import { inject } from 'inversify'
import mkdirp from 'mkdirp'
import path from 'path'

const tar = require('tar')

async function fileHash(filePath: string) {
  return new Promise(resolve => {
    const hash = crypto.createHash('sha256')
    const input = fs.createReadStream(filePath)
    input.on('readable', () => {
      const data = input.read()
      if (data) {
        hash.update(data)
      } else {
        resolve(hash.digest('hex'))
      }
    })
  })
}

export default class ModuleUnpacker {
  constructor(@inject(TYPES.Logger) private logger: Logger) {}

  async unpack(modulePath: string) {
    const hash = await fileHash(modulePath)
    const tempDirectory = this.createModulePath(modulePath, '.temp_cache')
    const temporaryDestination = this.createDestination(tempDirectory, hash)
    const finalDirectory = this.createModulePath(modulePath, '.cache')
    const finalDestination = this.createDestination(finalDirectory, hash)

    if (fs.existsSync(finalDestination)) {
      return finalDestination
    }

    mkdirp.sync(temporaryDestination) // Create the `.temp_cache` directory if doesn't exist

    this.logger.info(`Extracting module "${path.basename(modulePath)}" ...`)

    await tar.extract({
      file: modulePath,
      cwd: temporaryDestination
    })

    mkdirp.sync(finalDirectory) // Create the `.cache` directory if doesn't exist
    // We move in case the extraction failed and .cache is corrupted
    try {
      // Trying to rename first, since moving is very slow on windows
      fse.renameSync(temporaryDestination, finalDestination)
    } catch (err) {
      this.logger.warn(`Couldn't rename folder, trying to move it instead`)
      fse.moveSync(temporaryDestination, finalDestination)
    }

    return finalDestination
  }

  private createModulePath(modulePath, name) {
    return path.join(path.dirname(modulePath), name)
  }

  private createDestination(directory, hash) {
    return path.join(directory, `./module__${hash}`)
  }
}
