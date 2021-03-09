import * as sdk from 'botpress/sdk'
import getos from 'common/getos'
import fs from 'fs'
import nodePreGyp from 'node-pre-gyp'
import path from 'path'

const MODULE_ROOT = path.join(__dirname, '..', '..')

export default async (logger: sdk.Logger): Promise<boolean> => {
  const os = await getos() // TODO: checkout the correct subdirectory

  if (os.os === 'win32') {
    logger.warn(`unsupervised-qa does not work on operating system ${os.os}. Will be disabled.`)
    return false
  }

  try {
    const from = path.join(MODULE_ROOT, 'native_extensions', os.os, 'all', 'tfjs_binding.node')
    const to = nodePreGyp.find(path.join(MODULE_ROOT, 'node_modules', '@tensorflow', 'tfjs-node', 'package.json'))
    
    if (fs.existsSync(to)) {
      logger.info('TFJS dependencies seems to be already installed.')
      return true
    }

    fs.copyFileSync(from, to)
    return true
  } catch (err) {
    logger.attachError(err).warn('An error occured, unsupervised-qa will be disabled')
    return false
  }
}
