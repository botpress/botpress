import bcrypt from 'bcryptjs'
import * as sdk from 'botpress/sdk'
import crypto from 'crypto'
import LRUCache from 'lru-cache'
import { UserMapping } from 'src/backend/db'
import uuid from 'uuid'

const migration: sdk.ModuleMigration = {
  info: {
    description: 'Converts old tables to external messaging',
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
      const migrator = new MessagingSqliteUpMigrator(bp)
      await migrator.migrate()
      await migrator.cleanup()
    } else {
    }

    return { success: true, message: 'Tables migrated successfully' }
  },

  down: async ({ bp }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    if (!(await bp.database.schema.hasTable('conversations')) || !(await bp.database.schema.hasTable('messages'))) {
      return { success: true, message: 'Migration skipped' }
    }

    if (bp.database.isLite) {
    } else {
    }

    return { success: true, message: 'Tables migrated successfully' }
  }
}

class MessagingUpMigrator {
  protected clientIds: { [botId: string]: string } = {}

  constructor(protected bp: typeof sdk) {}

  async migrate() {
    await this.createTables()
    await this.createClients()
  }

  async cleanup() {
    await this.bp.database.schema.dropTable('web_messages')
    await this.bp.database.schema.dropTable('web_conversations')
  }

  async createTables() {
    // We need to create the messaging tables here because the messaging
    // server isn't started before we run the migrations

    await this.bp.database.createTableIfNotExists('msg_providers', table => {
      table.uuid('id').primary()
      table
        .string('name')
        .unique()
        .notNullable()
      table.boolean('sandbox').notNullable()
    })

    await this.bp.database.createTableIfNotExists('msg_clients', table => {
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

    await this.bp.database.createTableIfNotExists('msg_users', table => {
      table.uuid('id').primary()
      table
        .uuid('clientId')
        .references('id')
        .inTable('msg_clients')
        .notNullable()
    })

    await this.bp.database.createTableIfNotExists('msg_conversations', table => {
      table.uuid('id').primary()
      table
        .uuid('clientId')
        .references('id')
        .inTable('msg_clients')
        .notNullable()
      table
        .string('userId')
        .references('id')
        .inTable('msg_users')
        .notNullable()
      table.timestamp('createdOn').notNullable()
      table.index(['userId', 'clientId'])
    })

    await this.bp.database.createTableIfNotExists('msg_messages', table => {
      table.uuid('id').primary()
      table
        .uuid('conversationId')
        .references('id')
        .inTable('msg_conversations')
        .notNullable()
        .onDelete('cascade')
      table
        .string('authorId')
        .references('id')
        .inTable('msg_users')
        .nullable()
      table.timestamp('sentOn').notNullable()
      table.jsonb('payload').notNullable()
      table.index(['conversationId', 'sentOn'])
    })
  }

  async createClients() {
    const bots = await this.bp.bots.getAllBots()

    for (const bot of bots.values()) {
      const provider = {
        id: uuid.v4(),
        name: bot.id,
        sandbox: false
      }
      await this.bp.database('msg_providers').insert(provider)

      const token = crypto.randomBytes(66).toString('base64')
      const client = {
        id: uuid.v4(),
        providerId: provider.id,
        token: await bcrypt.hash(token, 10)
      }
      await this.bp.database('msg_clients').insert(client)

      this.clientIds[bot.id] = client.id

      await this.bp.config.mergeBotConfig(bot.id, {
        messaging: { clientId: client.id, clientToken: token, providerName: provider.name }
      })
    }
  }
}

class MessagingSqliteUpMigrator extends MessagingUpMigrator {
  private userBatch = []
  private userMapBatch = []
  private convoBatch = []
  private messageBatch = []
  private userCache = new LRUCache<string, string>({ max: 10000 })

  async migrate() {
    await super.migrate()

    const convCount = <number>Object.values((await this.bp.database('web_conversations').count('*'))[0])[0]

    for (let i = 0; i < convCount; i += 100) {
      const convos = await this.bp
        .database('web_conversations')
        .select('*')
        .offset(i)
        .limit(100)

      // We migrate 100 conversations at a time
      await this.migrateConvos(convos)
    }
  }

  private async migrateConvos(convos: any[]) {
    for (const convo of convos) {
      const clientId = this.clientIds[convo.botId]

      const newConvo = {
        id: uuid.v4(),
        userId: await this.getUserId(convo.userId, clientId),
        clientId,
        createdOn: convo.created_on
      }
      this.convoBatch.push(newConvo)

      const messages = await this.bp
        .database('web_messages')
        .select('*')
        .where({ conversationId: convo.id })

      for (const message of messages) {
        this.messageBatch.push({
          id: uuid.v4(),
          conversationId: newConvo.id,
          authorId: message.userId ? await this.getUserId(message.userId, clientId) : undefined,
          sentOn: message.sent_on,
          payload: message.payload
        })

        if (this.messageBatch.length > 50) {
          await this.emptyMessageBatch()
        }
      }

      if (this.convoBatch.length > 50) {
        await this.emptyConvoBatch()
      }
    }

    await this.emptyConvoBatch()
    await this.emptyMessageBatch()
  }

  private async getUserId(visitorId: string, clientId: string) {
    const cached = this.userCache.get(visitorId)
    if (cached) {
      return cached
    }

    const rows = await this.bp.database('web_user_map').where({ visitorId })

    if (rows?.length) {
      const { userId } = rows[0] as UserMapping
      this.userCache.set(visitorId, userId)
      return userId
    } else {
      const user = {
        id: uuid.v4(),
        clientId
      }
      this.userBatch.push(user)

      const mapping = {
        visitorId,
        userId: user.id
      }
      this.userMapBatch.push(mapping)

      this.userCache.set(visitorId, user.id)
      return user.id as string
    }
  }

  private async emptyUserBatch() {
    if (this.userBatch.length > 0) {
      await this.bp.database('web_user_map').insert(this.userMapBatch)
      this.userMapBatch = []

      await this.bp.database('msg_users').insert(this.userBatch)
      this.userBatch = []
    }
  }

  private async emptyConvoBatch() {
    await this.emptyUserBatch()

    if (this.convoBatch.length > 0) {
      await this.bp.database('msg_conversations').insert(this.convoBatch)
      this.convoBatch = []
    }
  }

  private async emptyMessageBatch() {
    await this.emptyConvoBatch()

    if (this.messageBatch.length > 0) {
      await this.bp.database('msg_messages').insert(this.messageBatch)
      this.messageBatch = []
    }
  }
}

export default migration
