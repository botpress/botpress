import * as sdk from 'botpress/sdk'

const migration: sdk.ModuleMigration = {
  info: {
    description: 'Converts old tables to messaging api',
    type: 'database'
  },
  up: async ({ bp }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    if (await bp.database.schema.hasTable('web_conversations')) {
      console.log('Migrating conversations...')

      const batchSize = 1000
      const conversationsCount = <number>(await bp.database('web_conversations').count())[0].count
      let maxId = 0

      for (let i = 0; i < conversationsCount; i += batchSize) {
        const conversations = await bp
          .database('web_conversations')
          .select('*')
          .offset(i)
          .limit(batchSize)

        conversations.forEach(conversation => {
          conversation.createdOn = conversation.created_on

          delete conversation.title
          delete conversation.description
          delete conversation.logo_url
          delete conversation.created_on
          delete conversation.last_heard_on
          delete conversation.user_last_seen_on
          delete conversation.bot_last_seen_on

          maxId = Math.max(maxId, conversation.id)
        })

        await bp.database('conversations').insert(conversations)
      }

      if (bp.database.isLite) {
        await bp.database.raw(`ALTER TABLE conversations AUTO_INCREMENT = ${maxId + 100}`)
      } else {
        await bp.database.raw(`ALTER SEQUENCE conversations_id_seq RESTART WITH ${maxId + 100}`)
      }
    }

    if (await bp.database.schema.hasTable('web_messages')) {
      console.log('Migrating messages...')

      const batchSize = 1000
      const messagesCount = <number>(await bp.database('web_messages').count())[0].count

      for (let i = 0; i < messagesCount; i += batchSize) {
        const messages = await bp
          .database('web_messages')
          .select('*')
          .offset(i)
          .limit(batchSize)

        messages.forEach(message => {
          message.sentOn = message.sent_on
          message.from = message.userId ? 'user' : 'bot'
          message.payload = {
            ...(message.payload || {}),
            web: { userName: message.full_name, avatarUrl: message.avatar_url }
          }

          delete message.id
          delete message.userId
          delete message.message_type
          delete message.message_text
          delete message.message_raw
          delete message.message_data
          delete message.full_name
          delete message.avatar_url
          delete message.sent_on
        })

        await bp.database('messages').insert(messages)
      }
    }

    return { success: true, message: 'Tables migrated successfully' }
  }
}

export default migration
