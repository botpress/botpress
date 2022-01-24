import { MessagingUpMigrator } from './up'

export class MessagingPostgresUpMigrator extends MessagingUpMigrator {
  protected async start() {
    this.trx = await this.bp.database.transaction()
  }

  protected async commit() {
    await this.trx.commit()
  }

  protected async rollback() {
    await this.trx.rollback()
  }

  protected async migrate() {
    await this.createTemporaryTables()
    await super.migrate()

    await this.collectVisitorIds()
    await this.createClientsForDeletedBots()
    await this.createUsers()
    await this.migrateConversations()
    await this.migrateMessages()
  }

  protected async createTables() {
    // We delete these tables in case the migration crashed halfway.
    await this.trx.raw('DROP TABLE IF EXISTS web_user_map CASCADE')

    await super.createTables()
  }

  protected async onClientCreated(botId: string, clientId: string) {
    await this.trx('temp_client_ids').insert({ botId, clientId })
  }

  private async collectVisitorIds() {
    await this.trx.raw(`
    INSERT INTO "temp_visitor_ids" (
      "userId", "visitorId", "botId")
    SELECT
      gen_random_uuid(),
      "web_conversations"."userId",
      "web_conversations"."botId"
    FROM "web_conversations"
    WHERE "web_conversations"."userId" IS NOT NULL AND "web_conversations"."botId" IS NOT NULL
    ON CONFLICT ON CONSTRAINT temp_visitor_ids_visitorid_botid_unique
    DO NOTHING`)

    await this.trx.raw(`
    INSERT INTO "temp_visitor_ids" (
      "userId", "visitorId", "botId")
    SELECT
      gen_random_uuid(),
      "web_messages"."userId",
      "web_conversations"."botId"
    FROM "web_messages"
    INNER JOIN "web_conversations" ON "web_conversations"."id" = "web_messages"."conversationId"
    WHERE "web_messages"."userId" IS NOT NULL AND "web_conversations"."botId" IS NOT NULL
    ON CONFLICT ON CONSTRAINT temp_visitor_ids_visitorid_botid_unique 
    DO NOTHING;`)
  }

  private async createClientsForDeletedBots() {
    const distinctBotIds = await this.trx.raw(`
    SELECT DISTINCT "temp_visitor_ids"."botId"
    FROM "temp_visitor_ids"`)

    for (const { botId } of distinctBotIds.rows) {
      const rows = await this.trx('temp_client_ids').where({ botId })
      if (rows?.length) {
        continue
      }

      if (botId?.length) {
        await this.createClient(botId, false)
      }
    }
  }

  private async createUsers() {
    await this.trx.raw(`
    INSERT INTO "msg_users" (
      "id", "clientId")
    SELECT
      "temp_visitor_ids"."userId",
      "temp_client_ids"."clientId"
    FROM "temp_visitor_ids"
    INNER JOIN "temp_client_ids" ON "temp_client_ids"."botId" = "temp_visitor_ids"."botId"`)

    await this.trx.raw(`
    INSERT INTO "web_user_map" (
      "botId", "visitorId", "userId")
    SELECT
      "temp_visitor_ids"."botId",
      "temp_visitor_ids"."visitorId",
      "temp_visitor_ids"."userId"
    FROM "temp_visitor_ids"`)
  }

  private async migrateConversations() {
    await this.trx.raw(`
    INSERT INTO "temp_new_convo_ids" (
      "oldId",
      "newId")
    SELECT
      "web_conversations"."id",
      gen_random_uuid()
    FROM "web_conversations"`)

    await this.trx.raw(`
    INSERT INTO "msg_conversations" (
      "id",
      "clientId",
      "userId",
      "createdOn")
    SELECT "temp_new_convo_ids"."newId",
      "temp_client_ids"."clientId",
      "temp_visitor_ids"."userId",
      COALESCE("web_conversations"."created_on", CURRENT_TIMESTAMP)
    FROM "web_conversations"
    INNER JOIN "temp_new_convo_ids" ON "web_conversations"."id" = "temp_new_convo_ids"."oldId"
    INNER JOIN "temp_visitor_ids" ON ("web_conversations"."userId" = "temp_visitor_ids"."visitorId" 
      AND "web_conversations"."botId" = "temp_visitor_ids"."botId")
    INNER JOIN "msg_users" ON "temp_visitor_ids"."userId" = "msg_users"."id"
    INNER JOIN "temp_client_ids" ON "web_conversations"."botId" = "temp_client_ids"."botId"`)
  }

  private async migrateMessages() {
    await this.trx.raw(`
    INSERT INTO "msg_messages" (
      "id",
      "conversationId",
      "authorId",
      "sentOn",
      "payload")
    SELECT gen_random_uuid(),
      "temp_new_convo_ids"."newId",
      "temp_visitor_ids"."userId",
      COALESCE("web_messages"."sent_on", CURRENT_TIMESTAMP),
      COALESCE("web_messages"."payload", '{}'::jsonb)
    FROM "web_messages"
    INNER JOIN "temp_new_convo_ids" ON "web_messages"."conversationId" = "temp_new_convo_ids"."oldId"
    INNER JOIN "msg_conversations" ON "temp_new_convo_ids"."newId" = "msg_conversations"."id"
    INNER JOIN "web_conversations" ON "web_conversations"."id" = "temp_new_convo_ids"."oldId"
    LEFT JOIN "temp_visitor_ids" ON ("web_messages"."userId" = "temp_visitor_ids"."visitorId"
      AND "web_conversations"."botId" = "temp_visitor_ids"."botId")`)
  }

  private async createTemporaryTables() {
    // extension needed for gen_random_uuid()
    await this.trx.raw('CREATE EXTENSION IF NOT EXISTS pgcrypto;')

    await this.trx.schema.dropTableIfExists('temp_client_ids')
    await this.trx.schema.createTable('temp_client_ids', table => {
      table.uuid('clientId').unique()
      table.string('botId').unique()
    })

    await this.trx.schema.dropTableIfExists('temp_visitor_ids')
    await this.trx.schema.createTable('temp_visitor_ids', table => {
      table.uuid('userId').unique()
      table.string('visitorId')
      table.string('botId')
      table.unique(['visitorId', 'botId'])
    })
  }

  protected async cleanup() {
    await this.trx.schema.dropTable('temp_client_ids')
    await this.trx.schema.dropTable('temp_visitor_ids')

    await this.trx.raw('DROP EXTENSION pgcrypto;')

    await super.cleanup()
  }
}
