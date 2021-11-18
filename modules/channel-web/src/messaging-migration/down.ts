import * as sdk from 'botpress/sdk'
import Knex from 'knex'

export abstract class MessagingDownMigrator {
  protected trx: Knex.Transaction<any, any>
  private messageCount: number
  private conversationCount: number

  constructor(protected bp: typeof sdk, protected isDryRun: boolean) {}

  async run() {
    await this.start()
    await this.takeMetrics()
    await this.migrate()
    await this.migrateReferences()
    await this.cleanup()

    const message = await this.compareMetrics()

    if (this.isDryRun) {
      await this.rollback()
    } else {
      await this.commit()
    }

    return message
  }

  private async takeMetrics() {
    this.messageCount = this.getCount(await this.trx('msg_messages').count())
    this.conversationCount = this.getCount(await this.trx('msg_conversations').count())
  }

  private async compareMetrics() {
    const newMessageCount = this.getCount(await this.trx('web_messages').count())
    const newConversationCount = this.getCount(await this.trx('web_conversations').count())
    const updatedSessionCount = this.getCount(
      await this.trx('dialog_sessions')
        .where('id', 'like', '%::web::%')
        .count()
    )

    const message =
      `\nConversations migrated: ${this.conversationCount} -> ${newConversationCount}` +
      `\nMessages migrated : ${this.messageCount} -> ${newMessageCount}` +
      `\nSessions updated : ${updatedSessionCount}`

    return message
  }

  private getCount(res: any) {
    return Number(Object.values(res[0])[0])
  }

  protected abstract start(): Promise<void>
  protected abstract commit(): Promise<void>
  protected abstract rollback(): Promise<void>

  protected async migrate() {
    await this.createTables()
  }

  protected async migrateReferences() {
    await this.updateUserReferences('events', 'target', 'botId')
    await this.updateUserReferences('handoffs', 'userId', 'botId')
    await this.updateUserReferences('bot_chat_users', 'userId', 'botId')

    await this.updateUserReferences('srv_channel_users', 'user_id')
    await this.updateUserReferences('data_retention', 'user_id')

    await this.updateConvoReferences('events', 'threadId')
    await this.updateConvoReferences('handoffs', 'userThreadId')
    await this.updateConvoReferences('handoffs', 'agentThreadId')
    await this.updateConvoReferences('comments', 'threadId')
  }

  private async updateUserReferences(table: string, column: string, botIdColumn?: string) {
    if (!(await this.bp.database.schema.hasTable(table))) {
      return
    }

    let subquery = `SELECT "web_user_map"."visitorId" FROM "web_user_map" WHERE "web_user_map"."userId"${
      this.bp.database.isLite ? '' : '::varchar'
    } = "${table}"."${column}"`
    if (botIdColumn) {
      subquery += ` AND "web_user_map"."botId" = "${table}"."${botIdColumn}"`
    }
    subquery += ' LIMIT 1'

    await this.trx.raw(`
      UPDATE "${table}"
      SET "${column}" = (${subquery})
      WHERE EXISTS (${subquery})`)
  }

  private async updateConvoReferences(table: string, column: string) {
    if (!(await this.bp.database.schema.hasTable(table))) {
      return
    }

    const subquery = `SELECT "temp_new_convo_ids"."newid" 
    FROM "temp_new_convo_ids" 
    WHERE "temp_new_convo_ids"."oldId"${this.bp.database.isLite ? '' : '::varchar'} = "${table}"."${column}"`

    await this.trx.raw(`
    UPDATE "${table}"
    SET "${column}" = (${subquery})
    WHERE EXISTS (${subquery})`)
  }

  protected async cleanup() {
    await this.trx.schema.dropTable('web_user_map')
    await this.trx.schema.dropTable('temp_new_convo_ids')
  }

  private async createTables() {
    await this.trx.schema.dropTableIfExists('web_conversations')
    await this.trx.schema.createTable('web_conversations', function(table) {
      table.increments('id').primary()
      table.string('userId')
      table.string('botId')
      table.string('title')
      table.string('description')
      table.string('logo_url')
      table.timestamp('created_on')
      table.timestamp('last_heard_on')
      table.timestamp('user_last_seen_on')
      table.timestamp('bot_last_seen_on')
      table.index(['userId', 'botId'], 'wcub_idx')
    })

    await this.trx.schema.dropTableIfExists('web_messages')
    await this.trx.schema.createTable('web_messages', function(table) {
      table.string('id').primary()
      table.integer('conversationId')
      table.string('incomingEventId')
      table.string('eventId')
      table.string('userId')
      table.string('message_type')
      table.text('message_text')
      table.jsonb('message_raw')
      table.jsonb('message_data')
      table.jsonb('payload')
      table.string('full_name')
      table.string('avatar_url')
      table.timestamp('sent_on')
      table.index(['conversationId', 'sent_on'], 'wmcs_idx')
    })

    await this.trx.raw(
      'CREATE INDEX IF NOT EXISTS wmcms_idx ON web_messages ("conversationId", message_type, sent_on DESC) WHERE message_type != \'visit\';'
    )

    await this.trx.schema.dropTableIfExists('temp_new_convo_ids')
    await this.trx.schema.createTable('temp_new_convo_ids', table => {
      table
        .uuid('oldId')
        .references('id')
        .inTable('msg_conversations')
        .unique()
      // newId needs to be lowercase here. For some reason alter sequence doesn't work when it has an uppercase letter
      table.increments('newid').unique()
    })
  }
}
