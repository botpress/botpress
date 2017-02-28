import Knex from 'knex'
import path from 'path'
import fs from 'fs'

import util from '../../util'

module.exports = bot_path => {
  const botfilePath = path.join(bot_path, 'botfile.js')
  const botfile = require(botfilePath)
  const dbLocation = path.resolve(path.join(bot_path, botfile.dataDir, 'db.sqlite'))

  return migrate_database_schema(dbLocation)
}


function migrate_database_schema(dbLocation) {

  const updateUsers = `strftime('%Y-%m-%dT%H:%M:%fZ', created_on/1000, 'unixepoch')`

  const knex = Knex({
    client: 'sqlite3',
    connection: { filename: dbLocation },
    useNullAsDefault: true
  })

  return knex.schema.table('users', function (table) {
    table.string('picture_url')
    table.string('first_name')
    table.string('last_name')
  })
  .then(() => knex('users').update({ created_on: knex.raw(updateUsers) }))
  .then(rows => {
    util.print('info', 'Updated ' + rows + ' users')
    util.print('warn', 'Users table was migrated to new schema but existing users will miss the following fields: `picture_url`, `first_name`, `last_name`. They have been left to `null`.')
  })
  .catch(() => {
    util.print('warn', 'Did not migrate table `users` as schema was already up to date')
  })
}

