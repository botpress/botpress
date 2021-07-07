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
      const migrator = new MessagingPostgresUpMigrator(bp)
      await migrator.migrate()
      // await migrator.cleanup()

      // throw new Error('stopp')
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

    await this.bp.database.schema.dropTableIfExists('msg_messages')
    await this.bp.database.schema.dropTableIfExists('msg_conversations')
    await this.bp.database.schema.dropTableIfExists('msg_users')
    await this.bp.database.schema.dropTableIfExists('msg_clients')
    await this.bp.database.schema.dropTableIfExists('msg_providers')
    await this.bp.database.schema.dropTableIfExists('web_user_map')

    await this.bp.database.createTableIfNotExists('web_user_map', table => {
      table.string('visitorId').primary()
      table.uuid('userId').unique()
    })

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
        .uuid('userId')
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
        .uuid('authorId')
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

      // In the odd case that a provider of that name already exists, we change its name to a random value to avoid crashing.
      // We can't delete it because there might be foreign keys pointing to it.
      const rows = await this.bp.database('msg_providers').where({ name: bot.id })
      if (rows?.length) {
        await this.bp
          .database('msg_providers')
          .where({ name: bot.id })
          .update({ name: `MIG_CONFLICT_${crypto.randomBytes(66).toString('base64')}` })
      }

      await this.bp.database('msg_providers').insert(provider)

      const token = crypto.randomBytes(66).toString('base64')
      const client = {
        id: uuid.v4(),
        providerId: provider.id,
        token: await bcrypt.hash(token, 10)
      }
      await this.bp.database('msg_clients').insert(client)

      await this.onClientCreated(bot.id, client.id)

      await this.bp.config.mergeBotConfig(bot.id, {
        messaging: { clientId: client.id, clientToken: token, providerName: provider.name }
      })
    }
  }

  async onClientCreated(botId: string, clientId: string) {}
}

class MessagingSqliteUpMigrator extends MessagingUpMigrator {
  protected clientIds: { [botId: string]: string } = {}
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

  async onClientCreated(botId: string, clientId: string) {
    this.clientIds[botId] = clientId
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

class MessagingPostgresUpMigrator extends MessagingUpMigrator {
  async migrate() {
    await this.bp.database.schema.dropTableIfExists('temp_client_ids')
    await this.bp.database.createTableIfNotExists('temp_client_ids', table => {
      table.uuid('clientId').unique()
      table.string('botId').unique()
    })

    await super.migrate()

    // extension needed for gen_random_uuid()
    await this.bp.database.raw('CREATE EXTENSION IF NOT EXISTS pgcrypto;')

    await this.bp.database.schema.dropTableIfExists('temp_visitor_ids')
    await this.bp.database.createTableIfNotExists('temp_visitor_ids', table => {
      table.uuid('userId').unique()
      table.string('visitorId').unique()
      table.string('botId')
    })

    await this.bp.database.raw(`
    INSERT INTO "temp_visitor_ids" (
      "userId", "visitorId", "botId")
    SELECT
      gen_random_uuid(),
      "web_conversations"."userId",
      "web_conversations"."botId"
    FROM "web_conversations"
    WHERE "web_conversations"."userId" IS NOT NULL
    ON CONFLICT ON CONSTRAINT temp_visitor_ids_visitorid_unique
    DO NOTHING;`)

    await this.bp.database.raw(`
    INSERT INTO "temp_visitor_ids" (
      "userId", "visitorId", "botId")
    SELECT
      gen_random_uuid(),
      "web_messages"."userId",
      "web_conversations"."botId"
    FROM "web_messages"
    INNER JOIN "web_conversations" ON "web_conversations"."id" = "web_messages"."conversationId"
    WHERE "web_messages"."userId" IS NOT NULL
    ON CONFLICT ON CONSTRAINT temp_visitor_ids_visitorid_unique 
    DO NOTHING;`)

    await this.bp.database.raw(`
    INSERT INTO "msg_users" (
      "id", "clientId")
    SELECT
      "temp_visitor_ids"."userId",
      "temp_client_ids"."clientId"
    FROM "temp_visitor_ids"
    INNER JOIN "temp_client_ids" ON "temp_client_ids"."botId" = "temp_visitor_ids"."botId"`)

    await this.bp.database.raw(`
    INSERT INTO "web_user_map" (
      "visitorId", "userId")
    SELECT
      "temp_visitor_ids"."visitorId",
      "temp_visitor_ids"."userId"
    FROM "temp_visitor_ids"`)

    await this.bp.database.schema.dropTableIfExists('temp_new_convo_ids')
    await this.bp.database.schema.createTable('temp_new_convo_ids', table => {
      table.integer('oldId').unique()
      table.uuid('newId').unique()
    })

    await this.bp.database.raw(`
    INSERT INTO "temp_new_convo_ids" (
      "oldId",
      "newId")
    SELECT
      "web_conversations"."id",
      gen_random_uuid()
    FROM "web_conversations"`)

    await this.bp.database.raw(`
    INSERT INTO "msg_conversations" (
      "id",
      "clientId",
      "userId",
      "createdOn")
    SELECT "temp_new_convo_ids"."newId",
      "temp_client_ids"."clientId",
      "temp_visitor_ids"."userId",
      "web_conversations"."created_on"
    FROM "web_conversations"
    INNER JOIN "temp_new_convo_ids" ON "web_conversations"."id" = "temp_new_convo_ids"."oldId"
    INNER JOIN "temp_visitor_ids" ON "web_conversations"."userId" = "temp_visitor_ids"."visitorId"
    INNER JOIN "temp_client_ids" ON "web_conversations"."botId" = "temp_client_ids"."botId"`)

    await this.bp.database.raw(`
    INSERT INTO "msg_messages" (
      "id",
      "conversationId",
      "authorId",
      "sentOn",
      "payload")
    SELECT gen_random_uuid(),
      "temp_new_convo_ids"."newId",
      "temp_visitor_ids"."userId",
      "web_messages"."sent_on",
      "web_messages"."payload"
    FROM "web_messages"
    INNER JOIN "temp_new_convo_ids" ON "web_messages"."conversationId" = "temp_new_convo_ids"."oldId"
    LEFT JOIN "temp_visitor_ids" ON "web_messages"."userId" = "temp_visitor_ids"."visitorId"`)

    await this.bp.database.schema.dropTable('temp_client_ids')
    await this.bp.database.schema.dropTable('temp_visitor_ids')
    await this.bp.database.schema.dropTable('temp_new_convo_ids')
  }

  async onClientCreated(botId: string, clientId: string) {
    await this.bp.database('temp_client_ids').insert({ botId, clientId })
  }
}

export default migration
