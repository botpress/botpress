/*
  It's module for run migration for every module which has dir "/migrations"
  in module root folder. Every files in dir must be
  [timestamp_miliseconds]__[name].js (example: 1538478025618__hitl_messages.js)
*/

import path from 'path'
import { existsSync, readdirSync } from 'fs'
import helpers from './helpers'

const getMigrationDirIfExist = (dirList, { root }) => {
  const migrationPath = path.resolve(root, './migrations')

  return existsSync(migrationPath) ? [...dirList, migrationPath] : dirList
}

const runUp = async (knex, dir) => {
  const passedMigrations = (await knex('knex_module_migrations').select('name')).map(({ name }) => name)
  const dirFiles = readdirSync(dir)
    .filter(file => /^\d+__.+\.js$/.test(file) && !passedMigrations.includes(file))
    .sort()

  for (let index = 0; index < dirFiles.length; index++) {
    const name = dirFiles[index]
    const migration = require(path.resolve(dir, name))

    migration.up && (await migration.up(knex))
    await knex('knex_module_migrations').insert({ name, migration_time: new Date() })
  }
}

module.exports = async (db, moduleDefinitions = []) => {
  const migrationsDirList = moduleDefinitions.reduce(getMigrationDirIfExist, [])
  const knex = await db.get()

  await helpers(knex).createTableIfNotExists('knex_module_migrations', table => {
    table.increments('id').primary()
    table.string('name')
    table.timestamp('migration_time')
  })

  return {
    up: () => Promise.all(migrationsDirList.map(dir => runUp(knex, dir))),
    /*
      TODO: write it only with changes in "botpress CL"
      maybe it will be make this command: botpress migrate:[up||down] [module_name]
    */
    down: () => ({}) // TODO: write it only with changes in "botpress CL"
  }
}
