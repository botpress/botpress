import * as sdk from 'botpress/sdk'

const migration: sdk.ModuleMigration = {
  info: {
    description: 'Converts old tables to messaging api',
    type: 'database'
  },
  up: async ({ bp }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    if (await bp.database.schema.hasTable('web_conversations')) {
      bp.logger.info('Migrating conversations...')

      await bp.database.raw(`
        INSERT INTO "conversations" (
          "id",
          "userId",
          "botId",
          "createdOn")
        SELECT "web_conversations"."id",
          "web_conversations"."userId",
          "web_conversations"."botId",
          "web_conversations"."created_on"
        FROM "web_conversations"`)

      if (!bp.database.isLite) {
        const maxId = <number>Object.values((await bp.database('conversations').max('id'))[0])[0]
        await bp.database.raw(`ALTER SEQUENCE conversations_id_seq RESTART WITH ${maxId + 1000}`)
      }
    }

    if (await bp.database.schema.hasTable('web_messages')) {
      bp.logger.info('Migrating messages...')

      await bp.database.raw(`
        INSERT INTO "messages" ("conversationId",
          "eventId",
          "incomingEventId",
          "from",
          "sentOn",
          "payload")
        SELECT "web_messages"."conversationId",
          "web_messages"."eventId",
          "web_messages"."incomingEventId",
          "web_messages"."userId",
          "web_messages"."sent_on",
          "web_messages"."payload"
        FROM "web_messages"`)

      await bp
        .database('messages')
        .update({ from: 'user' })
        .whereNotNull('from')

      await bp
        .database('messages')
        .update({ from: 'bot' })
        .whereNull('from')
    }

    return { success: true, message: 'Tables migrated successfully' }
  }
}

export default migration
