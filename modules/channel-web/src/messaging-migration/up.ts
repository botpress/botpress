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
    const updatedSessionCount = this.getCount(
      await this.trx('dialog_sessions')
        .where('id', 'like', '%::web::%')
        .count()
    )

    let message = `\nUsers created: ${userCount}`
    message += `\nSessions updated : ${updatedSessionCount}`
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

    let subquery = `SELECT "web_user_map"."userId" FROM "web_user_map" WHERE "web_user_map"."visitorId" = "${table}"."${column}"`
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

    const subquery = `SELECT "temp_new_convo_ids"."newId" 
    FROM "temp_new_convo_ids" 
    WHERE "temp_new_convo_ids"."oldId"${this.bp.database.isLite ? '' : '::varchar'} = "${table}"."${column}"`

    await this.trx.raw(`
    UPDATE "${table}"
    SET "${column}" = (${subquery})
    WHERE EXISTS (${subquery})`)
  }

  protected async cleanup() {
    await this.trx.schema.dropTable('web_messages')
    await this.trx.schema.dropTable('web_conversations')
    await this.trx.schema.dropTable('temp_new_convo_ids')
  }

  protected async createTables() {
    // We need to create this here because sometimes the migration is ran before the module is initialized
    await this.trx.schema.createTable('web_user_map', table => {
      table.string('botId')
      table.string('visitorId')
      table.uuid('userId').unique()
      table.primary(['botId', 'visitorId'])
    })

    await this.trx.schema.dropTableIfExists('temp_new_convo_ids')
    await this.trx.schema.createTable('temp_new_convo_ids', table => {
      table.integer('oldId').unique()
      table.uuid('newId').unique()
    })
  }

  protected async createClients() {
    const bots = await this.bp.bots.getAllBots()

    for (const botId of bots.keys()) {
      await this.createClient(botId, true)
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

    if (exists && !this.isDryRun) {
      try {
        await this.bp.config.mergeBotConfig(botId, {
          messaging: { id: client.id, token, channels: {} } as any
        })
      } catch {
        // fails when no bot.config.json is present.
        // Not really important as not having a bot.config.json makes no sense
        // It's possible anyways to get a new clientId and token at runtime using the botId so nothing is lost here.
      }
    }

    return client.id
  }

  protected abstract onClientCreated(botId: string, clientId: string)
}
