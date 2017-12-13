import path from 'path'
import fs from 'fs'
import Promise from 'bluebird'
import glob from 'glob'
import uuid from 'uuid'

import get from 'lodash/get'
import partition from 'lodash/partition'
import mapValues from 'lodash/mapValues'
import uniq from 'lodash/uniq'

Promise.promisifyAll(fs)
const globAsync = Promise.promisify(glob)

export const REVISIONS_FILE_NAME = '.ghost-revisions'

module.exports = ({ logger, db, projectLocation }) => {
  logger.info('[Ghost Content Manager] Initialized')

  const pendingRevisionsByFolder = {}
  const trackedFolders = []

  const upsert = ({ knex, tableName, where, data, idField = 'id' }) =>
    knex(tableName)
      .where(where)
      .select(idField)
      .then(res => {
        const id = get(res, '0.id')
        return id
          ? knex(tableName)
              .where(idField, id)
              .update(data)
              .then()
          : knex(tableName)
              .insert(Object.assign({}, where, data))
              .then()
      })

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

  const normalizeFolder = folder => {
    const folderPath = path.resolve(projectLocation, folder)
    return {
      folderPath,
      normalizedFolderName: path.relative(projectLocation, folderPath)
    }
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

  const addFolder = async (folder, filesGlob) => {
    const { folderPath, normalizedFolderName } = normalizeFolder(folder)

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
      // and also delete the fils no longer in the FS
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

  const recordRevision = async (folder, file, content) => {
    const knex = await db.get()

    const { normalizedFolderName } = normalizeFolder(folder)

    const id = await knex('ghost_content')
      .where({ folder: normalizedFolderName, file })
      .select('id')
      .get(0)
      .get('id')

    if (!id) {
      throw new Error(
        `No Ghost content for file: ${file} in folder: ${normalizedFolderName}. Cannot record the new revision.`
      )
    }

    const revision = uuid.v4()

    return knex.transaction(trx => {
      knex('ghost_content')
        .transacting(trx)
        .where({ id })
        .update({ content })
        .then(() =>
          knex('ghost_revisions')
            .transacting(trx)
            .insert({
              content_id: id,
              revision,
              created_by: 'admin'
            })
        )
        .then(trx.commit)
        .then(() => updatePendingForFolder(normalizedFolderName))
        .catch(err => {
          logger.error('[Ghost Content Manager]', err)
          trx.rollback()
        })
    })
  }

  const readFile = async (folder, file) => {
    const knex = await db.get()
    const { normalizedFolderName } = normalizeFolder(folder)
    return knex('ghost_content')
      .select('content')
      .where({ folder: normalizedFolderName, file })
      .get(0)
      .get('content')
  }

  const getPending = () => pendingRevisionsByFolder

  const getPendingWithContentForFolder = async (folderInfo, normalizedFolderName) => {
    const revisions = folderInfo.map(({ revision }) => revision)
    const fileNames = uniq(folderInfo.map(({ file }) => file))

    const knex = await db.get()
    const files = await knex('ghost_content')
      .select('file', 'content')
      .whereIn('file', fileNames)
      .andWhere({ folder: normalizedFolderName })

    return {
      files,
      revisions
    }
  }

  const getPendingWithContent = () => Promise.props(mapValues(pendingRevisionsByFolder, getPendingWithContentForFolder))

  return {
    addFolder,
    recordRevision,
    readFile,
    getPending,
    getPendingWithContent
  }
}
