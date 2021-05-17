import * as sdk from 'botpress/sdk'

const migration: sdk.ModuleMigration = {
  info: {
    description: 'Converts old tables to messaging api',
    type: 'database'
  },
  up: async ({ bp }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    if (bp.database.isLite) {
      // TODO do migration for sqlite
      throw 'migration for sqlite not yet implemented!'
    } else {
      await bp.database.schema.createTable('temp_new_convo_ids', table => {
        table
          .integer('oldId')
          .primary()
          .references('id')
          .inTable('web_conversations')
        table.uuid('newId')
      })

      await bp.database.raw(`
      INSERT INTO "temp_new_convo_ids" (
        "oldId",
        "newId")
      SELECT
        "web_conversations"."id",
        gen_random_uuid()
      FROM "web_conversations"`)

      await bp.database.raw(`
      INSERT INTO "conversations" (
        "id",
        "userId",
        "botId",
        "createdOn")
      SELECT "temp_new_convo_ids"."newId",
        "web_conversations"."userId",
        "web_conversations"."botId",
        "web_conversations"."created_on"
      FROM "web_conversations"
      INNER JOIN "temp_new_convo_ids" ON "web_conversations"."id" = "temp_new_convo_ids"."oldId"`)

      await bp.database.raw(`
      INSERT INTO "messages" (
        "id",
        "conversationId",
        "authorId",
        "eventId",
        "incomingEventId",
        "sentOn",
        "payload")
      SELECT gen_random_uuid(),
        "temp_new_convo_ids"."newId",
        "web_messages"."userId",
        "web_messages"."eventId",
        "web_messages"."incomingEventId",
        "web_messages"."sent_on",
        "web_messages"."payload"
      FROM "web_messages"
      INNER JOIN "temp_new_convo_ids" ON "web_messages"."conversationId" = "temp_new_convo_ids"."oldId"`)

      await bp.database.schema.dropTable('temp_new_convo_ids')
    }

    return { success: true, message: 'Tables migrated successfully' }
  }
}

export default migration
