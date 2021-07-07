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

    bp.database.createTableIfNotExists('msg_providers', table => {
      table.uuid('id').primary()
      table
        .string('name')
        .unique()
        .notNullable()
      table.boolean('sandbox').notNullable()
    })

    bp.database.createTableIfNotExists('msg_clients', table => {
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

    bp.database.createTableIfNotExists('msg_users', table => {
      table.uuid('id').primary()
      table
        .uuid('clientId')
        .references('id')
        .inTable('msg_clients')
        .notNullable()
    })

    bp.database.createTableIfNotExists('msg_conversations', table => {
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

    bp.database.createTableIfNotExists('msg_messages', table => {
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

    const bots = await bp.bots.getAllBots()
    const clientIds = {}

    for (const bot of bots.values()) {
      // TODO: remove this
      await bp
        .database('msg_providers')
        .where({ name: bot.id })
        .del()
      // ^^^

      const provider = {
        id: uuid.v4(),
        name: bot.id,
        sandbox: false
      }

      await bp.database('msg_providers').insert(provider)

      const token = crypto.randomBytes(66).toString('base64')

      const client = {
        id: uuid.v4(),
        providerId: provider.id,
        token: await bcrypt.hash(token, 10)
      }
      clientIds[bot.id] = client.id

      await bp.database('msg_clients').insert(client)

      await bp.config.mergeBotConfig(bot.id, {
        messaging: { clientId: client.id, clientToken: token, providerName: provider.name }
      })
    }

    if (bp.database.isLite) {
      const convCount = <number>Object.values((await bp.database('web_conversations').count('*'))[0])[0]

      let userBatch = []
      let userMapBatch = []
      let convoBatch = []
      let messageBatch = []
      const userCache = new LRUCache<string, string>({ max: 10000 })

      const emptyUserBatch = async () => {
        if (userBatch.length > 0) {
          await bp.database('web_user_map').insert(userMapBatch)
          userMapBatch = []

          await bp.database('msg_users').insert(userBatch)
          userBatch = []
        }
      }
      const emptyConvoBatch = async () => {
        await emptyUserBatch()

        if (convoBatch.length > 0) {
          await bp.database('msg_conversations').insert(convoBatch)
          convoBatch = []
        }
      }
      const emptyMessageBatch = async () => {
        await emptyConvoBatch()

        if (messageBatch.length > 0) {
          await bp.database('msg_messages').insert(messageBatch)
          messageBatch = []
        }
      }
      const getUserId = async (visitorId: string, clientId: string) => {
        const cached = userCache.get(visitorId)
        if (cached) {
          return cached
        }

        const rows = await bp.database('web_user_map').where({ visitorId })

        if (rows?.length) {
          const { userId } = rows[0] as UserMapping
          userCache.set(visitorId, userId)
          return userId
        } else {
          const user = {
            id: uuid.v4(),
            clientId
          }
          userBatch.push(user)

          const mapping = {
            visitorId,
            userId: user.id
          }
          userMapBatch.push(mapping)

          userCache.set(visitorId, user.id)

          return user.id as string
        }
      }

      for (let i = 0; i < convCount; i += 100) {
        const convos = await bp
          .database('web_conversations')
          .select('*')
          .offset(i)
          .limit(100)

        for (const convo of convos) {
          const clientId = clientIds[convo.botId]

          const newConvo = {
            id: uuid.v4(),
            userId: await getUserId(convo.userId, clientId),
            clientId,
            createdOn: convo.created_on
          }

          convoBatch.push(newConvo)

          const messages = await bp
            .database('web_messages')
            .select('*')
            .where({ conversationId: convo.id })

          for (const message of messages) {
            messageBatch.push({
              id: uuid.v4(),
              conversationId: newConvo.id,
              authorId: message.userId ? await getUserId(message.userId, clientId) : undefined,
              sentOn: message.sent_on,
              payload: message.payload
            })

            if (messageBatch.length > 50) {
              await emptyMessageBatch()
            }
          }

          if (convoBatch.length > 50) {
            await emptyConvoBatch()
          }
        }

        await emptyConvoBatch()
        await emptyMessageBatch()
      }

      // TODO: uncomment this
      // await bp.database.schema.dropTable('web_messages')
      // await bp.database.schema.dropTable('web_conversations')
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

export default migration
