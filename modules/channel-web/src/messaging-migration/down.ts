import * as sdk from 'botpress/sdk'
import Knex from 'knex'

export abstract class MessagingDownMigrator {
  protected trx: Knex.Transaction<any, any>

  constructor(protected bp: typeof sdk) {}

  async run() {
    await this.start()
    await this.migrate()
    await this.cleanup()
    await this.commit()
  }

  protected abstract start(): Promise<void>
  protected abstract commit(): Promise<void>

  protected async migrate() {
    await this.createTables()
  }

  protected async cleanup() {
    await this.trx.schema.dropTable('web_user_map')
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
  }
}
