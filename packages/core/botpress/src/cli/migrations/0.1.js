import Knex from 'knex'
import path from 'path'
import fs from 'fs'

import kvs from '../../database/kvs'
import util from '../../util'

function dropTableIfExists(knex, tableName) {
  return knex.schema.hasTable(tableName).then(has => {
    if (has) {
      return knex.schema.dropTable(tableName)
    }
  })
}

function migrate_database_schema(dbLocation) {
  const updateUsers = `strftime('%Y-%m-%dT%H:%M:%fZ', created_on/1000, 'unixepoch')`

  const knex = Knex({
    client: 'sqlite3',
    connection: { filename: dbLocation },
    useNullAsDefault: true
  })

  return knex.schema
    .table('users', function(table) {
      table.string('picture_url')
      table.string('first_name')
      table.string('last_name')
    })
    .then(() => knex('users').update({ created_on: knex.raw(updateUsers) }))
    .then(rows => {
      util.print('info', 'Updated ' + rows + ' users')
      util.print(
        'warn',
        'Users table was migrated to new schema but existing ' +
          'users will miss the following fields: `picture_url`, `first_name`, ' +
          '`last_name`. They have been left to `null`.'
      )
    })
    .catch(() => {
      util.print('warn', 'Did not migrate table `users` as schema was already up to date')
    })
    .then(() => kvs(knex).bootstrap())
    .catch(() => {
      util.print('warn', 'Did not create table `kvs` as schema was already up to date')
    })
    .then(() => {
      if (!process.env.DELETE_TABLES) {
        util.print(
          'warn',
          'This migration must delete the tables of ' +
            'the following modules: `botpress-scheduler`, `botpress-analytics`, ' +
            '`botpress-hitl` and `botpress-subscription`.'
        )

        util.print(
          'warn',
          "This step has been skipped because you didn't provide " + 'the DELETE_TABLES=true environement variable.'
        )

        util.print('warn', 'Please backup your data if necessary then re-run with DELETE_TABLES=true')
        return false
      }

      return dropTableIfExists(knex, 'analytics_interactions')
        .then(() => dropTableIfExists(knex, 'analytics_runs'))
        .then(() => dropTableIfExists(knex, 'broadcast_outbox'))
        .then(() => dropTableIfExists(knex, 'broadcast_schedules'))
        .then(() => dropTableIfExists(knex, 'hitl_messages'))
        .then(() => dropTableIfExists(knex, 'hitl_sessions'))
        .then(() => dropTableIfExists(knex, 'subscription_users'))
        .then(() => dropTableIfExists(knex, 'subscriptions'))
        .then(() => dropTableIfExists(knex, 'scheduler_schedules'))
        .then(() => dropTableIfExists(knex, 'scheduler_tasks'))
        .then(() => util.print('info', 'Dropped module tables'))
    })
}

function migrate_botfile(botfilePath) {
  const before = fs.readFileSync(botfilePath).toString()

  if (before.indexOf('postgres:') >= 0) {
    util.print(
      'warn',
      'Did not migrate botfile as it seemed like `postgres`' +
        ' was already present. Please migrate manually if this is a mistake.'
    )
    return false
  }

  const after = before.replace(
    /module\.exports.*?=.*?{/i,
    `module.exports = {

  /**
  * Postgres configuration
  */
  postgres: {
    enabled: process.env.DATABASE === 'postgres',
    host: process.env.PG_HOST || '127.0.0.1',
    port: process.env.PG_PORT || 5432,
    user: process.env.PG_USER || '',
    password: process.env.PG_PASSWORD || '',
    database: process.env.PG_DB || ''
  },`
  )

  fs.writeFileSync(botfilePath, after)

  util.print('info', 'Updated botfile')
}

module.exports = bot_path => {
  const botfilePath = path.join(bot_path, 'botfile.js')
  const botfile = require(botfilePath)
  const dbLocation = path.resolve(path.join(bot_path, botfile.dataDir, 'db.sqlite'))

  return migrate_database_schema(dbLocation).then(() => migrate_botfile(botfilePath))
}
