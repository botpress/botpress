import LRUCache from 'lru-cache'
import uuid from 'uuid'
import { MessagingUpMigrator } from './up'

export class MessagingSqliteUpMigrator extends MessagingUpMigrator {
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
      const { userId } = rows[0]
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
