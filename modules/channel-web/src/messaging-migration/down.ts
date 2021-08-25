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

    const message =
      `\nConversations migrated: ${this.conversationCount} -> ${newConversationCount}` +
      `\nMessages migrated : ${this.messageCount} -> ${newMessageCount}`

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
