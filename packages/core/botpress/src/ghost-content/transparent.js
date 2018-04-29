/*
  Transparent Ghost Content Manager hs the same API but
  proxies all calls directly to the FS.
  It's used while in development.
*/

import path from 'path'
import fs from 'fs'
import mkdirp from 'mkdirp'
import Promise from 'bluebird'
import glob from 'glob'

import { normalizeFolder as _normalizeFolder } from './util'

Promise.promisifyAll(fs)
const mkdirpAsync = Promise.promisify(mkdirp)

module.exports = ({ logger, projectLocation }) => {
  const normalizeFolder = _normalizeFolder(projectLocation)

  const folderOptions = {}

  logger.info('[Ghost Content Manager] (transparent) Initialized')

  return {
    addRootFolder: (rootFolder, options = {}) => {
      const { normalizedFolderName } = normalizeFolder(rootFolder)
      logger.debug(`[Ghost Content Manager] (transparent) Added root folder ${normalizedFolderName}, doing nothing.`)
      folderOptions[normalizedFolderName] = options
    },

    upsertFile: (folder, file, content) => {
      const { folderPath } = normalizeFolder(folder)
      const filePath = path.join(folderPath, file)
      const fullFileFolder = path.dirname(filePath)
      return mkdirpAsync(fullFileFolder)
        .then(() => fs.writeFileAsync(filePath, content))
        .catch(e => {
          logger.error('[Ghost Content Manager] (transparent) upsertFile error', e)
          throw e
        })
    },

    readFile: (folder, file) => {
      const { folderPath, normalizedFolderName } = normalizeFolder(folder)
      const filePath = path.join(folderPath, file)
      const isBinary = (folderOptions[normalizedFolderName] || {}).isBinary || false
      return fs
        .readFileAsync(filePath, isBinary ? null : 'utf8')
        .catch({ code: 'ENOENT' }, () => null)
        .catch(e => {
          logger.error('[Ghost Content Manager] (transparent) readFile error', e)
          throw e
        })
    },

    deleteFile: (folder, file) => {
      const { folderPath } = normalizeFolder(folder)
      const filePath = path.join(folderPath, file)
      return fs.unlinkAsync(filePath).catch(e => {
        logger.error('[Ghost Content Manager] (transparent) deleteFile error', e)
        throw e
      })
    },

    directoryListing: (rootFolder, fileEndingPattern = '', pathsToOmit = []) => {
      const { folderPath } = normalizeFolder(rootFolder)
      return fs
        .accessAsync(folderPath)
        .then(
          () =>
            Promise.fromCallback(cb => glob(`**/*${fileEndingPattern}`, { cwd: folderPath }, cb)).then(paths =>
              paths.filter(path => !pathsToOmit.includes(path))
            ),
          () => []
        )
        .catch(e => {
          logger.error('[Ghost Content Manager] (transparent) directoryListing error', e)
          throw e
        })
    },

    getPending: () => ({}),

    getPendingWithContent: () => ({})
  }
}
