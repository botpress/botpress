/*
  Transparent Ghost Content Manager hs the same API but
  proxies all calls directly to the FS.
  It's used while in development.
*/

import path from 'path'
import fs from 'fs'
import Promise from 'bluebird'

import { normalizeFolder as _normalizeFolder } from './util'

Promise.promisifyAll(fs)

module.exports = ({ logger, projectLocation }) => {
  const normalizeFolder = _normalizeFolder(projectLocation)

  logger.info('[Ghost Content Manager] (transparent) Initialized')

  return {
    addFolder: (folder, filesGlob) => {
      const { normalizedFolderName } = normalizeFolder(folder)
      logger.debug(`[Ghost Content Manager] (transparent) Added folder ${normalizedFolderName}, doing nothing.`)
    },
    recordRevision: (folder, file, content) => {
      const { folderPath } = normalizeFolder(folder)
      const filePath = path.join(folderPath, file)
      return fs.writeFileAsync(filePath, content)
    },
    readFile: (folder, file) => {
      const { folderPath } = normalizeFolder(folder)
      const filePath = path.join(folderPath, file)
      return fs.readFileAsync(filePath, 'utf-8')
    },
    getPending: () => ({}),
    getPendingWithContent: () => ({})
  }
}
