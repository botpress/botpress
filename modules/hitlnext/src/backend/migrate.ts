import * as sdk from 'botpress/sdk'

import { COMMENT_TABLE_NAME, HANDOFF_TABLE_NAME, MODULE_NAME } from '../constants'

const debug = DEBUG(MODULE_NAME)

export default async (bp: typeof sdk) => {
  await bp.database.createTableIfNotExists(HANDOFF_TABLE_NAME, table => {
    debug(`Creating database table '${HANDOFF_TABLE_NAME}'`)

    table
      .increments('id')
      .primary()
      .notNullable()
    table.string('botId').notNullable()
    table.string('userId').notNullable()
    table.string('agentId')
    table.string('userThreadId').notNullable()
    table.string('userChannel').notNullable()
    table.string('agentThreadId')
    table.string('status').notNullable()
    table.json('tags')
    table.dateTime('assignedAt')
    table.dateTime('resolvedAt')
    table.dateTime('createdAt').notNullable()
    table.dateTime('updatedAt').notNullable()

    table.unique(['id'])
    table.index(['botId'])
  })

  await bp.database.createTableIfNotExists(COMMENT_TABLE_NAME, table => {
    debug(`Creating database table '${COMMENT_TABLE_NAME}'`)

    table
      .increments('id')
      .primary()
      .notNullable()
    table
      .integer('handoffId')
      .references(`${HANDOFF_TABLE_NAME}.id`)
      .notNullable()
      .onDelete('CASCADE')
    table.string('threadId').notNullable()
    table.string('agentId').notNullable()
    table.text('content')
    table.dateTime('createdAt').notNullable()
    table.dateTime('updatedAt').notNullable()

    table.unique(['id'])
    table.index('handoffId')
    table.index('agentId')
  })
}
