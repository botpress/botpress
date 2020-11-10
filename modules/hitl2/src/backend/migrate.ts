import * as sdk from 'botpress/sdk'

export default async (bp: typeof sdk) => {
  await bp.database.createTableIfNotExists('comments', table => {
    table
      .increments('id')
      .primary()
      .notNullable()
    table
      .integer('escalationId')
      .references('escalations.id')
      .notNullable()
      .onDelete('CASCADE')
    table.string('threadId').notNullable()
    table.string('agentId').notNullable()
    table.text('content')
    table.dateTime('createdAt').notNullable()
    table.dateTime('updatedAt').notNullable()

    table.unique(['id'])
    table.index('escalationId')
    table.index('agentId')
  })

  await bp.database.createTableIfNotExists('escalations', table => {
    table
      .increments('id')
      .primary()
      .notNullable()
    table.string('botId').notNullable()
    table.string('userId').notNullable()
    table.string('agentId')
    table.string('userThreadId').notNullable()
    table.string('agentThreadId')
    table.string('status').notNullable()
    table.dateTime('assignedAt')
    table.dateTime('resolvedAt')
    table.dateTime('createdAt').notNullable()
    table.dateTime('updatedAt').notNullable()

    table.unique(['id'])
    table.index(['botId'])
  })
}
