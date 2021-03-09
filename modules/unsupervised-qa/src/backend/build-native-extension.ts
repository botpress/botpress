import * as sdk from 'botpress/sdk'
import getos from 'common/getos'
import fs from 'fs'
import nodePreGyp from 'node-pre-gyp'
import path from 'path'

const MODULE_ROOT = path.join(__dirname, '..', '..')

const nativeExtensionPathFromDistro = (distro: OSDistribution) => {
  const subdir = 'all' // TODO: use the actual subdirectory
  return path.join(MODULE_ROOT, 'native_extensions', distro.os, subdir, 'tfjs_binding.node')
}

const distroToString = (distro: OSDistribution) => {
  const { os, dist, release } = distro
  if (os && dist && release) {
    return `${os} ${dist} ${release}`
  }
  return os
}

const distroNotSupportedMsg = (distro: OSDistribution) => {
  return `Operating system ${distroToString(distro)} is not supported. Module won't make any prediction.`
}

export default async (logger: sdk.Logger): Promise<boolean> => {
  const distro = await getos() // TODO: checkout the correct subdirectory

  if (distro.os === 'win32') {
    logger.warn(distroNotSupportedMsg(distro))
    return false
  }

  try {
    const from = nativeExtensionPathFromDistro(distro)
    const to = nodePreGyp.find(path.join(MODULE_ROOT, 'node_modules', '@tensorflow', 'tfjs-node', 'package.json'))

    if (fs.existsSync(to)) {
      // logger.info('TFJS dependencies seems to be already installed.')
      return true
    }

    if (!fs.existsSync(from)) {
      logger.warn(distroNotSupportedMsg(distro))
      return false
    }

    logger.info(`Copying native extension ${from} to ${to}.`)
    fs.copyFileSync(from, to)
    return true
  } catch (err) {
    logger.attachError(err).warn("An error occured while copying native extension, Module won't make any prediction.")
    return false
  }
}
