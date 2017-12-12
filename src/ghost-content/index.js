import path from 'path'
import fs from 'fs'
import Promise from 'bluebird'
import glob from 'glob'
import uuid from 'uuid'
import get from 'lodash/get'

Promise.promisifyAll(fs)
const globAsync = Promise.promisify(glob)

module.exports = ({ logger, db, projectLocation }) => {
  logger.info('Ghost Content Manager initialized')

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

  const addFolder = async (folder, filesGlob) => {
    const { folderPath, normalizedFolderName } = normalizeFolder(folder)
    const files = await globAsync(filesGlob, { cwd: folderPath })
    await Promise.map(files, file => recordFile(folderPath, normalizedFolderName, file))
  }

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
            .then()
        )
        .then(trx.commit)
        .catch(err => {
          logger.error(err)
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

  const getPending = async () => {
    const knex = await db.get()
    return knex('ghost_revisions')
      .join('ghost_content', 'ghost_content.id', '=', 'ghost_revisions.content_id')
      .select('ghost_content.folder', 'ghost_content.file', 'ghost_revisions.revision', 'ghost_revisions.created_on')
      .then()
  }

  return {
    addFolder,
    recordRevision,
    readFile,
    getPending
  }
}
