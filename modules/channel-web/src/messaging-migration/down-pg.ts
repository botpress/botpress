import { MessagingDownMigrator } from './down'

export class MessagingPostgresDownMigrator extends MessagingDownMigrator {
  private convoIndex = 0

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
    await super.migrate()

    this.convoIndex = <number>Object.values((await this.trx('web_conversations').max('id'))[0])[0] || 1
    await this.createTemporaryTables()

    await this.migrateConversations()
    await this.migrateMessages()

    await this.migrateReferences()
  }

  protected async cleanup() {
    await super.cleanup()

    const tables = await this.trx('pg_catalog.pg_tables')
      .select('tablename')
      .andWhere('tablename', 'like', 'msg_%')

    for (const table of tables) {
      await this.trx.raw(`DROP TABLE ${table.tablename} CASCADE`)
    }

    await this.trx.raw('DROP EXTENSION pgcrypto;')
  }

  private async migrateConversations() {
    const convCount = <number>Object.values((await this.trx('msg_conversations').count('*'))[0])[0] || 0

    await this.trx.raw(`
    INSERT INTO "temp_new_convo_ids" (
      "oldId")
    SELECT
      "msg_conversations"."id"
    FROM "msg_conversations"`)

    await this.trx.raw(`
    INSERT INTO "web_conversations" (
      "id",
      "userId",
      "botId",
      "created_on")
    SELECT "temp_new_convo_ids"."newid",
      "web_user_map"."visitorId",
      "msg_providers"."name",
      "msg_conversations"."createdOn"
    FROM "msg_conversations"
    INNER JOIN "temp_new_convo_ids" ON "msg_conversations"."id" = "temp_new_convo_ids"."oldId"
    INNER JOIN "msg_clients" ON "msg_clients"."id" = "msg_conversations"."clientId"
    INNER JOIN "msg_providers" ON "msg_providers"."id" = "msg_clients"."providerId"
    INNER JOIN "web_user_map" ON ("web_user_map"."userId" = "msg_conversations"."userId" AND "web_user_map"."botId" = "msg_providers"."name")`)
    await this.trx.raw(`ALTER SEQUENCE web_conversations_id_seq RESTART WITH ${this.convoIndex + convCount + 1}`)
  }

  private async migrateMessages() {
    await this.trx.raw(`
    INSERT INTO "web_messages" (
      "id",
      "conversationId",
      "userId",
      "message_type",
      "sent_on",
      "payload")
    SELECT gen_random_uuid(),
      "temp_new_convo_ids"."newid",
      "web_user_map"."visitorId",
      ' ',
      "msg_messages"."sentOn",
      "msg_messages"."payload"
    FROM "msg_messages"
    INNER JOIN "temp_new_convo_ids" ON "msg_messages"."conversationId" = "temp_new_convo_ids"."oldId"
    INNER JOIN "web_conversations" ON "web_conversations"."id" = "temp_new_convo_ids"."newid"
    LEFT JOIN "web_user_map" ON ("web_user_map"."userId" = "msg_messages"."authorId" AND "web_user_map"."botId" = "web_conversations"."botId")`)

    await this.trx('web_messages')
      .whereNotNull('userId')
      .update({ full_name: 'User' })
  }

  private async createTemporaryTables() {
    // extension needed for gen_random_uuid()
    await this.trx.raw('CREATE EXTENSION IF NOT EXISTS pgcrypto;')

    await this.trx.raw(`ALTER SEQUENCE temp_new_convo_ids_newid_seq RESTART WITH ${this.convoIndex + 1}`)
  }
}
