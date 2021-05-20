import * as sdk from 'botpress/sdk'
import uuid from 'uuid'

const migration: sdk.ModuleMigration = {
  info: {
    description: 'Converts old tables to messaging api',
    type: 'database'
  },
  up: async ({ bp }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    if (
      !(await bp.database.schema.hasTable('web_conversations')) ||
      !(await bp.database.schema.hasTable('web_messages'))
    ) {
      return { success: true, message: 'Migration skipped' }
    }

    if (bp.database.isLite) {
      const convCount = <number>Object.values((await bp.database('web_conversations').count('*'))[0])[0]

      let convoBatch = []
      let messageBatch = []

      const emptyConvoBatch = async () => {
        if (convoBatch.length > 0) {
          await bp.database('conversations').insert(convoBatch)
          convoBatch = []
        }
      }
      const emptyMessageBatch = async () => {
        await emptyConvoBatch()

        if (messageBatch.length > 0) {
          await bp.database('messages').insert(messageBatch)
          messageBatch = []
        }
      }

      for (let i = 0; i < convCount; i += 100) {
        const convos = await bp
          .database('web_conversations')
          .select('*')
          .offset(i)
          .limit(100)

        for (const convo of convos) {
          const newConvo = {
            id: uuid.v4(),
            userId: convo.userId,
            botId: convo.botId,
            createdOn: convo.created_on
          }

          convoBatch.push(newConvo)

          const messages = await bp
            .database('web_messages')
            .select('*')
            .where({ conversationId: convo.id })

          for (const message of messages) {
            messageBatch.push({
              id: uuid.v4(),
              conversationId: newConvo.id,
              authorId: message.userId,
              eventId: message.eventId,
              incomingEventId: message.incomingEventId,
              sentOn: message.sent_on,
              payload: message.payload
            })

            if (messageBatch.length > 50) {
              await emptyMessageBatch()
            }
          }

          if (convoBatch.length > 50) {
            await emptyConvoBatch()
          }
        }

        await emptyConvoBatch()
        await emptyMessageBatch()
      }

      await bp.database.schema.dropTable('web_messages')
      await bp.database.schema.dropTable('web_conversations')
    } else {
      // extension needed for gen_random_uuid()
      await bp.database.raw('CREATE EXTENSION IF NOT EXISTS pgcrypto;')

      if (await bp.database.schema.hasTable('temp_new_convo_ids')) {
        await bp.database.schema.dropTable('temp_new_convo_ids')
      }

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

      await bp.database.raw('DROP EXTENSION pgcrypto;')

      await bp.database.schema.dropTable('web_messages')
      await bp.database.schema.dropTable('web_conversations')
    }

    return { success: true, message: 'Tables migrated successfully' }
  },

  down: async ({ bp }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    if (!(await bp.database.schema.hasTable('conversations')) || !(await bp.database.schema.hasTable('messages'))) {
      return { success: true, message: 'Migration skipped' }
    }

    if (bp.database.isLite) {
      const convCount = <number>Object.values((await bp.database('conversations').count('*'))[0])[0]
      let convIndex = <number>Object.values((await bp.database('web_conversations').max('id'))[0])[0]

      let convoBatch = []
      let messageBatch = []

      const emptyConvoBatch = async () => {
        if (convoBatch.length > 0) {
          await bp.database('web_conversations').insert(convoBatch)
          convoBatch = []
        }
      }
      const emptyMessageBatch = async () => {
        await emptyConvoBatch()

        if (messageBatch.length > 0) {
          await bp.database('web_messages').insert(messageBatch)
          messageBatch = []
        }
      }

      for (let i = 0; i < convCount; i += 100) {
        const convos = await bp
          .database('conversations')
          .select('*')
          .offset(i)
          .limit(100)

        for (const convo of convos) {
          const newConvo = {
            id: ++convIndex,
            userId: convo.userId,
            botId: convo.botId,
            created_on: convo.createdOn
          }

          convoBatch.push(newConvo)

          const messages = await bp
            .database('messages')
            .select('*')
            .where({ conversationId: convo.id })

          for (const message of messages) {
            messageBatch.push({
              id: uuid.v4(),
              conversationId: newConvo.id,
              incomingEventId: message.incomingEventId,
              eventId: message.eventId,
              userId: message.authorId,
              sent_on: message.sentOn,
              payload: message.payload
            })

            if (messageBatch.length > 50) {
              await emptyMessageBatch()
            }
          }

          if (convoBatch.length > 50) {
            await emptyConvoBatch()
          }
        }

        await emptyConvoBatch()
        await emptyMessageBatch()
      }

      await bp.database.schema.dropTable('messages')
      await bp.database.schema.dropTable('conversations')
    } else {
      // TODO: what kind of performance on these queries?
      const convCount = <number>Object.values((await bp.database('conversations').count('*'))[0])[0]
      const convIndex = <number>Object.values((await bp.database('web_conversations').max('id'))[0])[0]

      // extension needed for gen_random_uuid()
      await bp.database.raw('CREATE EXTENSION IF NOT EXISTS pgcrypto;')

      if (await bp.database.schema.hasTable('temp_new_convo_ids')) {
        await bp.database.schema.dropTable('temp_new_convo_ids')
      }

      await bp.database.schema.createTable('temp_new_convo_ids', table => {
        table
          .uuid('oldId')
          .references('id')
          .inTable('conversations')
        // newId needs to be lowercase here. For some reason alter sequence doesn't work when it has an uppercase letter
        table.increments('newid')
        table.index('oldId')
      })
      await bp.database.raw(`ALTER SEQUENCE temp_new_convo_ids_newid_seq RESTART WITH ${convIndex + 1}`)

      await bp.database.raw(`
      INSERT INTO "temp_new_convo_ids" (
        "oldId")
      SELECT
        "conversations"."id"
      FROM "conversations"`)

      await bp.database.raw(`
      INSERT INTO "web_conversations" (
        "id",
        "userId",
        "botId",
        "created_on")
      SELECT "temp_new_convo_ids"."newid",
        "conversations"."userId",
        "conversations"."botId",
        "conversations"."createdOn"
      FROM "conversations"
      INNER JOIN "temp_new_convo_ids" ON "conversations"."id" = "temp_new_convo_ids"."oldId"`)
      await bp.database.raw(`ALTER SEQUENCE web_conversations_id_seq RESTART WITH ${convIndex + convCount + 1}`)

      await bp.database.raw(`
      INSERT INTO "web_messages" (
        "id",
        "conversationId",
        "userId",
        "eventId",
        "incomingEventId",
        "sent_on",
        "payload")
      SELECT gen_random_uuid(),
        "temp_new_convo_ids"."newid",
        "messages"."authorId",
        "messages"."eventId",
        "messages"."incomingEventId",
        "messages"."sentOn",
        "messages"."payload"
      FROM "messages"
      INNER JOIN "temp_new_convo_ids" ON "messages"."conversationId" = "temp_new_convo_ids"."oldId"`)

      await bp.database.schema.dropTable('temp_new_convo_ids')

      await bp.database.raw('DROP EXTENSION pgcrypto;')

      await bp.database.schema.dropTable('messages')
      await bp.database.schema.dropTable('conversations')
    }

    return { success: true, message: 'Tables migrated successfully' }
  }
}

export default migration
