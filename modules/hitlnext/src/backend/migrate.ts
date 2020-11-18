import * as sdk from 'botpress/sdk'

import { MODULE_NAME } from '../constants'
const debug = DEBUG(MODULE_NAME)

export default async (bp: typeof sdk) => {
  await bp.database.createTableIfNotExists('handoffs', table => {
    debug("Creating database table 'handoffs'")

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
    table.dateTime('assignedAt')
    table.dateTime('resolvedAt')
    table.dateTime('createdAt').notNullable()
    table.dateTime('updatedAt').notNullable()

    table.unique(['id'])
    table.index(['botId'])
  })

  await bp.database.createTableIfNotExists('comments', table => {
    debug("Creating database table 'comments'")

    table
      .increments('id')
      .primary()
      .notNullable()
    table
      .integer('handoffId')
      .references('handoffs.id')
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
