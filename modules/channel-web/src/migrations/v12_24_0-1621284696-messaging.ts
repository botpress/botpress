import bcrypt from 'bcryptjs'
import * as sdk from 'botpress/sdk'
import crypto from 'crypto'
import Knex from 'knex'
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
      await migrator.run()
    } else {
      const migrator = new MessagingPostgresUpMigrator(bp)
      await migrator.run()
    }

    return { success: true, message: 'Tables migrated successfully' }
  },

  down: async ({ bp }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    if (
      !(await bp.database.schema.hasTable('msg_conversations')) ||
      !(await bp.database.schema.hasTable('msg_messages'))
    ) {
      return { success: true, message: 'Migration skipped' }
    }

    if (bp.database.isLite) {
      const migrator = new MessagingSqliteDownMigrator(bp)
      await migrator.run()
    } else {
      const migrator = new MessagingPostgresDownMigrator(bp)
      await migrator.run()
    }

    return { success: true, message: 'Tables migrated successfully' }
  }
}

abstract class MessagingUpMigrator {
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

class MessagingSqliteUpMigrator extends MessagingUpMigrator {
  private clientIds: { [botId: string]: string } = {}
  private userBatch = []
  private userMapBatch = []
  private convoBatch = []
  private messageBatch = []
  private userCache = new LRUCache<string, string>({ max: 10000 })

  protected async start() {
    this.trx = this.bp.database as any
  }

  protected async commit() {}

  protected async migrate() {
    await super.migrate()

    const convCount = <number>Object.values((await this.trx('web_conversations').count('*'))[0])[0]

    for (let i = 0; i < convCount; i += 100) {
      const convos = await this.trx('web_conversations')
        .select('*')
        .offset(i)
        .limit(100)

      // We migrate 100 conversations at a time
      await this.migrateConvos(convos)
    }
  }

  protected async createTables() {
    await this.trx.raw('PRAGMA foreign_keys = OFF;')

    // We delete these tables in case the migration crashed halfway.
    await this.trx.schema.dropTableIfExists('web_user_map')
    await this.trx.schema.dropTableIfExists('msg_messages')
    await this.trx.schema.dropTableIfExists('msg_conversations')
    await this.trx.schema.dropTableIfExists('msg_users')
    await this.trx.schema.dropTableIfExists('msg_clients')
    await this.trx.schema.dropTableIfExists('msg_providers')

    await this.trx.raw('PRAGMA foreign_keys = ON;')

    await super.createTables()
  }

  protected async onClientCreated(botId: string, clientId: string) {
    this.clientIds[botId] = clientId
  }

  private async migrateConvos(convos: any[]) {
    for (const convo of convos) {
      let clientId = this.clientIds[convo.botId]
      if (!clientId) {
        clientId = await this.createClient(convo.botId, false)
      }

      const newConvo = {
        id: uuid.v4(),
        userId: await this.getUserId(convo.botId, convo.userId, clientId),
        clientId,
        createdOn: convo.created_on
      }
      this.convoBatch.push(newConvo)

      const messages = await this.trx('web_messages')
        .select('*')
        .where({ conversationId: convo.id })

      for (const message of messages) {
        this.messageBatch.push({
          id: uuid.v4(),
          conversationId: newConvo.id,
          authorId: message.userId ? await this.getUserId(convo.botId, message.userId, clientId) : undefined,
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

  private async getUserId(botId: string, visitorId: string, clientId: string) {
    const cached = this.userCache.get(`${botId}_${visitorId}`)
    if (cached) {
      return cached
    }

    const rows = await this.trx('web_user_map').where({ botId, visitorId })

    if (rows?.length) {
      const { userId } = rows[0] as UserMapping
      this.userCache.set(`${botId}_${visitorId}`, userId)
      return userId
    } else {
      const user = {
        id: uuid.v4(),
        clientId
      }
      this.userBatch.push(user)

      const mapping = {
        botId,
        visitorId,
        userId: user.id
      }
      this.userMapBatch.push(mapping)

      this.userCache.set(`${botId}_${visitorId}`, user.id)
      return user.id as string
    }
  }

  private async emptyUserBatch() {
    if (this.userBatch.length > 0) {
      await this.trx('web_user_map').insert(this.userMapBatch)
      this.userMapBatch = []

      await this.trx('msg_users').insert(this.userBatch)
      this.userBatch = []
    }
  }

  private async emptyConvoBatch() {
    await this.emptyUserBatch()

    if (this.convoBatch.length > 0) {
      await this.trx('msg_conversations').insert(this.convoBatch)
      this.convoBatch = []
    }
  }

  private async emptyMessageBatch() {
    await this.emptyConvoBatch()

    if (this.messageBatch.length > 0) {
      await this.trx('msg_messages').insert(this.messageBatch)
      this.messageBatch = []
    }
  }
}

class MessagingPostgresUpMigrator extends MessagingUpMigrator {
  protected async start() {
    this.trx = await this.bp.database.transaction()
  }

  protected async commit() {
    await this.trx.commit()
  }

  protected async migrate() {
    await this.createTemporaryTables()
    await super.migrate()

    await this.collectVisitorIds()
    await this.createClientsForDeletedBots()
    await this.createUsers()
    await this.migrateConversations()
    await this.migrateMessages()

    await this.cleanupTemporaryTables()
  }

  protected async createTables() {
    // We delete these tables in case the migration crashed halfway.
    await this.trx.raw('DROP TABLE IF EXISTS web_user_map CASCADE')
    await this.trx.raw('DROP TABLE IF EXISTS msg_messages CASCADE')
    await this.trx.raw('DROP TABLE IF EXISTS msg_conversations CASCADE')
    await this.trx.raw('DROP TABLE IF EXISTS msg_users CASCADE')
    await this.trx.raw('DROP TABLE IF EXISTS msg_clients CASCADE')
    await this.trx.raw('DROP TABLE IF EXISTS msg_providers CASCADE')

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
    WHERE "web_conversations"."userId" IS NOT NULL
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
    WHERE "web_messages"."userId" IS NOT NULL
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

      await this.createClient(botId, false)
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
      "web_conversations"."created_on"
    FROM "web_conversations"
    INNER JOIN "temp_new_convo_ids" ON "web_conversations"."id" = "temp_new_convo_ids"."oldId"
    INNER JOIN "temp_visitor_ids" ON ("web_conversations"."userId" = "temp_visitor_ids"."visitorId" 
      AND "web_conversations"."botId" = "temp_visitor_ids"."botId")
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
      "web_messages"."sent_on",
      "web_messages"."payload"
    FROM "web_messages"
    INNER JOIN "temp_new_convo_ids" ON "web_messages"."conversationId" = "temp_new_convo_ids"."oldId"
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

    await this.trx.schema.dropTableIfExists('temp_new_convo_ids')
    await this.trx.schema.createTable('temp_new_convo_ids', table => {
      table.integer('oldId').unique()
      table.uuid('newId').unique()
    })
  }

  private async cleanupTemporaryTables() {
    await this.trx.schema.dropTable('temp_client_ids')
    await this.trx.schema.dropTable('temp_visitor_ids')
    await this.trx.schema.dropTable('temp_new_convo_ids')

    await this.trx.raw('DROP EXTENSION pgcrypto;')
  }
}

abstract class MessagingDownMigrator {
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

class MessagingSqliteDownMigrator extends MessagingDownMigrator {
  private convoBatch = []
  private messageBatch = []
  private cacheVisitorIds = new LRUCache<string, string>({ max: 10000 })
  private cacheBotIds = new LRUCache<string, string>({ max: 10000 })
  private convoIndex = 0

  protected async start() {
    this.trx = this.bp.database as any
  }

  protected async commit() {}

  protected async migrate() {
    await super.migrate()

    const convCount = <number>Object.values((await this.trx('msg_conversations').count('*'))[0])[0] || 0
    this.convoIndex = <number>Object.values((await this.trx('web_conversations').max('id'))[0])[0] || 1

    for (let i = 0; i < convCount; i += 100) {
      const convos = await this.trx('msg_conversations')
        .select('*')
        .offset(i)
        .limit(100)

      // We migrate 100 conversations at a time
      await this.migrateConvos(convos)
    }
  }

  protected async cleanup() {
    await super.cleanup()

    await this.trx.raw('PRAGMA foreign_keys = OFF;')

    await this.trx.schema.dropTable('msg_messages')
    await this.trx.schema.dropTable('msg_conversations')
    await this.trx.schema.dropTable('msg_users')
    await this.trx.schema.dropTable('msg_clients')
    await this.trx.schema.dropTable('msg_providers')

    await this.trx.raw('PRAGMA foreign_keys = ON;')
  }

  private async migrateConvos(convos: any[]) {
    for (const convo of convos) {
      const botId = await this.getBotId(convo.clientId)

      const newConvo = {
        id: ++this.convoIndex,
        userId: convo.userId ? await this.getVisitorId(convo.userId) : undefined,
        botId,
        created_on: convo.createdOn
      }

      this.convoBatch.push(newConvo)

      const messages = await this.trx('msg_messages')
        .select('*')
        .where({ conversationId: convo.id })

      for (const message of messages) {
        this.messageBatch.push({
          id: uuid.v4(),
          conversationId: newConvo.id,
          // Necessary otherwise the messages aren't listed
          full_name: message.authorId ? 'User' : undefined,
          // Hack to make an old query work
          message_type: ' ',
          userId: message.authorId ? await this.getVisitorId(message.authorId) : undefined,
          sent_on: message.sentOn,
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

  private async getVisitorId(userId: string) {
    const cached = this.cacheVisitorIds.get(userId)
    if (cached) {
      return cached
    }

    const rows = await this.trx('web_user_map').where({ userId })

    if (rows?.length) {
      const { visitorId } = rows[0] as UserMapping
      this.cacheVisitorIds.set(userId, visitorId)
      return visitorId
    }

    return undefined
  }

  private async getBotId(clientId: string) {
    const cached = this.cacheBotIds.get(clientId)
    if (cached) {
      return cached
    }

    const [client] = await this.trx('msg_clients').where({ id: clientId })
    const [provider] = await this.trx('msg_providers').where({ id: client.providerId })

    this.cacheBotIds.set(clientId, provider.name)

    return provider.name
  }

  private async emptyConvoBatch() {
    if (this.convoBatch.length > 0) {
      await this.trx('web_conversations').insert(this.convoBatch)
      this.convoBatch = []
    }
  }

  private async emptyMessageBatch() {
    await this.emptyConvoBatch()

    if (this.messageBatch.length > 0) {
      await this.trx('web_messages').insert(this.messageBatch)
      this.messageBatch = []
    }
  }
}

class MessagingPostgresDownMigrator extends MessagingDownMigrator {
  private convoIndex = 0

  protected async start() {
    this.trx = await this.bp.database.transaction()
  }

  protected async commit() {
    await this.trx.commit()
  }

  protected async migrate() {
    await super.migrate()

    this.convoIndex = <number>Object.values((await this.trx('web_conversations').max('id'))[0])[0] || 1
    await this.createTemporaryTables()

    await this.migrateConversations()
    await this.migrateMessages()

    await this.cleanupTemporaryTables()
  }

  protected async cleanup() {
    await super.cleanup()

    await this.trx.raw('DROP TABLE msg_messages CASCADE')
    await this.trx.raw('DROP TABLE msg_conversations CASCADE')
    await this.trx.raw('DROP TABLE msg_users CASCADE')
    await this.trx.raw('DROP TABLE msg_clients CASCADE')
    await this.trx.raw('DROP TABLE msg_providers CASCADE')
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
    await this.trx.raw(`ALTER SEQUENCE temp_new_convo_ids_newid_seq RESTART WITH ${this.convoIndex + 1}`)
  }

  private async cleanupTemporaryTables() {
    await this.trx.raw('DROP EXTENSION pgcrypto;')

    await this.trx.schema.dropTable('temp_new_convo_ids')
  }
}

export default migration
