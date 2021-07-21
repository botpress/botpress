import LRUCache from 'lru-cache'
import uuid from 'uuid'
import { MessagingDownMigrator } from './down'

export class MessagingSqliteDownMigrator extends MessagingDownMigrator {
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
      const { visitorId } = rows[0]
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
