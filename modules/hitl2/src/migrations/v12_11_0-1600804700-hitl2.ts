import * as sdk from 'botpress/sdk'

const migration: sdk.ModuleMigration = {
  info: {
    description: 'Creates escalations and comments tables',
    target: 'core',
    type: 'database'
  },
  up: async ({ bp, metadata }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    console.log('hey there !')
    try {
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
    } catch (e) {
      return { success: false }
    }

    return {
      success: true
    }
  },
  down: async ({ bp, metadata }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    return {
      success: true
    }
  }
}

export default migration
