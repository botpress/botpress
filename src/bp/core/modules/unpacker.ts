import { Logger } from 'botpress/sdk'
import { TYPES } from 'core/types'
import crypto from 'crypto'
import fs from 'fs'
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
    const directory = path.join(path.dirname(modulePath), '.cache')

    const finalDestination = path.join(directory, `./module__${hash}`)

    if (fs.existsSync(finalDestination)) {
      return finalDestination
    }

    mkdirp.sync(finalDestination) // Create the `.cache` directory if doesn't exist

    this.logger.info(`Extracting module "${path.basename(modulePath)}" ...`)

    await tar.extract({
      file: modulePath,
      cwd: finalDestination
    })

    return finalDestination
  }
}
