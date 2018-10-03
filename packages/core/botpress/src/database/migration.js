/*
  It's module for run migration for every module which has dir "/migrations"
  in module root folder. Every files in dir must be
  [timestamp_miliseconds]__[name].js (example: 1538478025618__hitl_messages.js)
*/

import path from 'path'
import { existsSync, readdirSync } from 'fs'

const getMigrationDirIfExist = (dirList, { root }) => {
  const migrationPath = path.resolve(root, './migrations')

  return existsSync(migrationPath) ? [...dirList, migrationPath] : dirList
}

const runUp = async (knex, dir) => {
  const dirFiles = readdirSync(dir)
    .filter(file => /^\d+__.+\.js$/.test(file))
    .sort()

  for (let index = 0; index < dirFiles.length; index++) {
    const migration = require(path.resolve(dir, dirFiles[index]))

    migration.up && (await migration.up(knex))
  }
}

module.exports = async (db, moduleDefinitions = []) => {
  const migrationsDirList = moduleDefinitions.reduce(getMigrationDirIfExist, [])
  const knex = await db.get()

  return {
    up: () => Promise.all(migrationsDirList.map(dir => runUp(knex, dir))),
    /*
      TODO: write it only with changes in "botpress CL"
      maybe it will be make this command: botpress migrate:[up||down] [module_name]
    */
    down: () => ({}) // TODO: write it only with changes in "botpress CL"
  }
}
