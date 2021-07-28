import bcrypt from 'bcryptjs'
import * as sdk from 'botpress/sdk'
import crypto from 'crypto'
import Knex from 'knex'
import uuid from 'uuid'

export abstract class MessagingUpMigrator {
  protected trx: Knex.Transaction<any, any>
  private orphanMessageCount: number
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
    this.messageCount = this.getCount(await this.trx('web_messages').count())

    this.orphanMessageCount =
      this.messageCount -
      this.getCount(
        await this.trx
          .queryBuilder()
          .count()
          .from(q => {
            q.select('web_messages.id')
              .from('web_messages')
              .innerJoin('web_conversations', 'conversationId', 'web_conversations.id')
              .as('messages_with_conversations')
          })
      )

    this.conversationCount = this.getCount(await this.trx('web_conversations').count())
  }

  private async compareMetrics() {
    const userCount = this.getCount(await this.trx('msg_users').count())
    const newMessageCount = this.getCount(await this.trx('msg_messages').count())
    const newConversationCount = this.getCount(await this.trx('msg_conversations').count())

    let message = `\nUsers created: ${userCount}`
    message += `\nConversations migrated: ${this.conversationCount} -> ${newConversationCount}`
    message += `\nMessages migrated : ${this.messageCount} -> ${newMessageCount}`
    message += `\nMessages that were pointing to deleted conversations: ${this.orphanMessageCount}`

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
    await this.createClients()
  }

  protected async cleanup() {
    await this.trx.schema.dropTable('web_messages')
    await this.trx.schema.dropTable('web_conversations')
  }

  protected async createTables() {
    // We need to create the messaging tables here because the messaging
    // server isn't started before we run the migrations

    await this.trx.schema.createTable('msg_providers', table => {
      table.uuid('id').primary()
      table
        .string('name')
        .unique()
        .notNullable()
      table.boolean('sandbox').notNullable()
    })

    await this.trx.schema.createTable('msg_clients', table => {
      table.uuid('id').primary()
      table
        .uuid('providerId')
        .references('id')
        .inTable('msg_providers')
        .unique()
        .notNullable()
      table
        .string('token')
        .unique()
        .notNullable()
    })

    await this.trx.schema.createTable('msg_users', table => {
      table.uuid('id').primary()
      table
        .uuid('clientId')
        .references('id')
        .inTable('msg_clients')
        .notNullable()
    })

    await this.trx.schema.createTable('msg_conversations', table => {
      table.uuid('id').primary()
      table
        .uuid('clientId')
        .references('id')
        .inTable('msg_clients')
        .notNullable()
      table
        .uuid('userId')
        .references('id')
        .inTable('msg_users')
        .notNullable()
      table.timestamp('createdOn').notNullable()
      table.index(['userId', 'clientId'])
    })

    await this.trx.schema.createTable('msg_messages', table => {
      table.uuid('id').primary()
      table
        .uuid('conversationId')
        .references('id')
        .inTable('msg_conversations')
        .notNullable()
        .onDelete('cascade')
      table
        .uuid('authorId')
        .references('id')
        .inTable('msg_users')
        .nullable()
      table.timestamp('sentOn').notNullable()
      table.jsonb('payload').notNullable()
      table.index(['conversationId', 'sentOn'])
    })

    // We need to create this here because sometimes the migration is ran before the module is initalized
    await this.trx.schema.createTable('web_user_map', table => {
      table.string('botId')
      table.string('visitorId')
      table.uuid('userId').unique()
      table.primary(['botId', 'visitorId'])
    })
  }

  protected async createClients() {
    const bots = await this.bp.bots.getAllBots()

    for (const bot of bots.values()) {
      await this.createClient(bot.id, true)
    }
  }

  protected async createClient(botId: string, exists: boolean) {
    const provider = {
      id: uuid.v4(),
      name: botId,
      sandbox: false
    }

    await this.trx('msg_providers').insert(provider)

    const token = crypto.randomBytes(66).toString('base64')
    const client = {
      id: uuid.v4(),
      providerId: provider.id,
      token: await bcrypt.hash(token, 10)
    }
    await this.trx('msg_clients').insert(client)

    await this.onClientCreated(botId, client.id)

    if (exists) {
      await this.bp.config.mergeBotConfig(botId, {
        messaging: { id: client.id, token, channels: {} }
      })
    }

    return client.id
  }

  protected abstract onClientCreated(botId: string, clientId: string)
}
