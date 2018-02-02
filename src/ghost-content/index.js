import path from 'path'
import fs from 'fs'
import Promise from 'bluebird'
import glob from 'glob'
import nanoid from 'nanoid'

import get from 'lodash/get'
import partition from 'lodash/partition'
import mapValues from 'lodash/mapValues'
import uniq from 'lodash/uniq'

import createTransparent from './transparent'
import { normalizeFolder as _normalizeFolder } from './util'

Promise.promisifyAll(fs)
const globAsync = Promise.promisify(glob)

const REVISIONS_FILE_NAME = '.ghost-revisions'

module.exports = ({ logger, db, projectLocation, enabled }) => {
  if (!enabled) {
    return createTransparent({ logger, projectLocation })
  }

  const normalizeFolder = _normalizeFolder(projectLocation)

  const pendingRevisionsByFolder = {}
  const trackedFolders = []

  const upsert = ({ knex, tableName, where, data, idField = 'id', trx = null }) => {
    const prepareQuery = () => (trx ? knex(tableName).transacting(trx) : knex(tableName))
    return prepareQuery()
      .where(where)
      .select(idField)
      .then(res => {
        const id = get(res, '0.id')
        return id
          ? prepareQuery()
              .where(idField, id)
              .update(data)
              .thenReturn(id)
          : prepareQuery()
              .insert({ ...where, ...data }, 'id')
              .then(([insertedId]) => insertedId)
      })
  }

  const recordFile = async (folderPath, folder, file) => {
    const knex = await db.get()
    const filePath = path.join(folderPath, file)
    await fs.readFileAsync(filePath, 'utf-8').then(content =>
      upsert({
        knex,
        tableName: 'ghost_content',
        where: { folder, file },
        data: { content }
      })
    )
  }

  const getPendingRevisions = async normalizedFolderName => {
    const knex = await db.get()

    return knex('ghost_revisions')
      .join('ghost_content', 'ghost_content.id', '=', 'ghost_revisions.content_id')
      .where('ghost_content.folder', normalizedFolderName)
      .select(
        'ghost_content.file',
        'ghost_revisions.id',
        'ghost_revisions.revision',
        'ghost_revisions.created_on',
        'ghost_revisions.created_by'
      )
      .orderBy('ghost_revisions.created_on', 'desc')
      .then()
  }

  const addRootFolder = async (rootFolder, filesGlob) => {
    const { folderPath, normalizedFolderName } = normalizeFolder(rootFolder)

    logger.debug(`[Ghost Content Manager] adding folder ${normalizedFolderName}`)
    trackedFolders.push(normalizedFolderName)

    // read known revisions
    const revisionsFile = path.join(folderPath, REVISIONS_FILE_NAME)
    const fileRevisionsPromise = fs
      .readFileAsync(revisionsFile, 'utf-8')
      .catch({ code: 'ENOENT' }, () => '')
      .then(content =>
        content
          .trim()
          .split('\n')
          .map(s => s.trim())
          .filter(s => !!s && !s.startsWith('#'))
          .reduce((acc, r) => {
            acc[r] = true
            return acc
          }, {})
      )

    const [knownRevisions, dbRevisions] = await Promise.all([
      fileRevisionsPromise,
      getPendingRevisions(normalizedFolderName)
    ])

    const [revisionsToDelete, remainingRevisions] = partition(dbRevisions, ({ revision }) => knownRevisions[revision])

    const knex = await db.get()

    // cleanup known revisions
    if (revisionsToDelete.length) {
      logger.debug(
        `[Ghost Content Manager] ${normalizedFolderName}: deleting ${revisionsToDelete.length} known revision(s).`
      )
      await knex('ghost_revisions')
        .whereIn('id', revisionsToDelete.map(({ id }) => id))
        .del()
    }

    if (remainingRevisions.length) {
      logger.debug(`[Ghost Content Manager] ${normalizedFolderName}: ${remainingRevisions.length} pending revision(s).`)
      // record remaining revisions if any
      pendingRevisionsByFolder[normalizedFolderName] = remainingRevisions
    } else {
      logger.debug(
        `[Ghost Content Manager] ${normalizedFolderName} has no pending revisions, updating DB from the file system.`
      )
      // otherwise update the content in the DB
      const files = await globAsync(filesGlob, { cwd: folderPath })
      await Promise.map(files, file => recordFile(folderPath, normalizedFolderName, file))
      // and also delete the files no longer in the FS
      await knex('ghost_content')
        .whereNotIn('file', files)
        .andWhere('folder', normalizedFolderName)
        .del()
        .then()
    }
  }

  const updatePendingForFolder = async normalizedFolderName => {
    pendingRevisionsByFolder[normalizedFolderName] = await getPendingRevisions(normalizedFolderName)
  }

  const updatePendingForAllFolders = () => Promise.each(trackedFolders, updatePendingForFolder)

  const recordRevision = (knex, content_id, trx) =>
    knex('ghost_revisions')
      .transacting(trx)
      .insert({ content_id, revision: nanoid(), created_by: 'admin' })

  const upsertFile = async (rootFolder, file, content) => {
    const knex = await db.get()

    const folder = normalizeFolder(rootFolder).normalizedFolderName

    if (
      await knex('ghost_content')
        .where({ folder, file, content })
        .count('id as count')
        .then(([res]) => Number(res.count) > 0)
    ) {
      return Promise.resolve()
    }

    return knex.transaction(trx => {
      upsert({ knex, tableName: 'ghost_content', where: { folder, file }, data: { content }, trx })
        .then(content_id => recordRevision(knex, content_id, trx))
        .then(trx.commit)
        .then(() => updatePendingForFolder(folder))
        .catch(err => {
          logger.error('[Ghost Content Manager]', err)
          trx.rollback()
        })
    })
  }

  const readFile = async (rootFolder, file) => {
    const knex = await db.get()
    const { normalizedFolderName } = normalizeFolder(rootFolder)
    return knex('ghost_content')
      .select('content')
      .where({ folder: normalizedFolderName, file })
      .then(results => {
        if (!results || !results.length) {
          return null
        }
        const result = results[0]
        return (result && result.content) || null
      })
  }

  const deleteFile = async (rootFolder, file) => {
    const knex = await db.get()
    const { normalizedFolderName } = normalizeFolder(rootFolder)

    const id = get(
      await knex('ghost_content')
        .where({ folder: normalizedFolderName, file, deleted: 0 })
        .select('id'),
      '0.id'
    )

    if (!id) {
      throw new Error(`Can't delete file: ${file}: couldn't find it in folder: ${normalizedFolderName}`)
    }

    return knex.transaction(trx => {
      knex('ghost_content')
        .transacting(trx)
        .where({ id })
        .update({ deleted: 1, content: null })
        .then(() => recordRevision(knex, id, trx))
        .then(trx.commit)
        .then(() => updatePendingForFolder(normalizedFolderName))
        .catch(err => {
          logger.error('[Ghost Content Manager]', err)
          trx.rollback()
        })
    })
  }

  const directoryListing = async (rootFolder, fileEndingPattern = '', pathsToOmit = []) => {
    const knex = await db.get()
    const { normalizedFolderName } = normalizeFolder(rootFolder)
    return knex('ghost_content')
      .select('file')
      .whereNotIn('file', pathsToOmit)
      .andWhere({ folder: normalizedFolderName, deleted: 0 })
      .andWhere('file', 'like', `%${fileEndingPattern}`)
      .then(res => res.map(row => row.file))
  }

  const getPending = () => pendingRevisionsByFolder

  const getPendingWithContentForFolder = async (folderInfo, normalizedFolderName) => {
    const revisions = folderInfo.map(({ revision }) => revision)
    const fileNames = uniq(folderInfo.map(({ file }) => file))

    const knex = await db.get()
    const files = await knex('ghost_content')
      .select('file', 'content', 'deleted')
      .whereIn('file', fileNames)
      .andWhere({ folder: normalizedFolderName })

    return {
      files,
      revisions
    }
  }

  const getPendingWithContent = () => Promise.props(mapValues(pendingRevisionsByFolder, getPendingWithContentForFolder))

  logger.info('[Ghost Content Manager] Initialized')

  return {
    addRootFolder,
    upsertFile,
    readFile,
    deleteFile,
    directoryListing,
    getPending,
    getPendingWithContent
  }
}

// TODO: switch to ES6 modules
module.exports.REVISIONS_FILE_NAME = REVISIONS_FILE_NAME
