import LRUCache from 'lru-cache'
import uuid from 'uuid'
import { MessagingUpMigrator } from './up'

export class MessagingSqliteUpMigrator extends MessagingUpMigrator {
  private clientIds: { [botId: string]: string } = {}
  private userBatch = []
  private userMapBatch = []
  private convoBatch = []
  private convoNewIdsBatch = []
  private messageBatch = []
  private sessionBatch: { oldId: string; newId: string }[] = []
  private userCache = new LRUCache<string, string>({ max: 10000 })

  protected async start() {
    if (this.bp.database.isLite) {
      this.trx = this.bp.database as any
    } else {
      this.trx = await this.bp.database.transaction()
    }
  }

  protected async commit() {
    if (!this.bp.database.isLite) {
      await this.trx.commit()
    }
  }

  protected async rollback() {
    if (!this.bp.database.isLite) {
      await this.trx.rollback()
    }
  }

  protected async migrate() {
    await super.migrate()

    const batchSize = this.bp.database.isLite ? 100 : 5000
    const convCount = <number>Object.values((await this.trx('web_conversations').count('*'))[0])[0]

    this.bp.logger.info(`Migration will migrate ${convCount} conversations`)

    for (let i = 0; i < convCount; i += batchSize) {
      const convos = await this.trx('web_conversations')
        .select('*')
        .offset(i)
        .limit(batchSize)
        .orderBy('id')

      // We migrate batchSize conversations at a time
      await this.migrateConvos(convos)

      this.bp.logger.info(`Migrated conversations ${i} to ${Math.min(i + batchSize, convCount)}`)
    }
  }

  protected async createTables() {
    if (this.bp.database.isLite) {
      await this.trx.raw('PRAGMA foreign_keys = OFF;')

      // We delete these tables in case the migration crashed halfway.
      await this.trx.schema.dropTableIfExists('web_user_map')

      await this.trx.raw('PRAGMA foreign_keys = ON;')
    } else {
      // We delete these tables in case the migration crashed halfway.
      await this.trx.raw('DROP TABLE IF EXISTS web_user_map CASCADE')
    }

    await super.createTables()
  }

  protected async onClientCreated(botId: string, clientId: string) {
    this.clientIds[botId] = clientId
  }

  private async migrateConvos(convos: any[]) {
    const maxBatchSize = this.bp.database.isLite ? 50 : 2000

    const defaultPayload = JSON.stringify({})
    const defaultDate = new Date().toISOString()

    for (const convo of convos) {
      if (!convo.botId?.length || !convo.userId?.length) {
        continue
      }

      let clientId = this.clientIds[convo.botId]
      if (!clientId) {
        clientId = await this.createClient(convo.botId, false)
      }

      const newConvo = {
        id: uuid.v4(),
        userId: await this.getUserId(convo.botId, convo.userId, clientId),
        clientId,
        createdOn: convo.created_on || defaultDate
      }
      this.convoBatch.push(newConvo)
      this.convoNewIdsBatch.push({ oldId: convo.id, newId: newConvo.id })

      const oldSessionId = `${convo.botId}::web::${convo.userId}::${convo.id}`
      if (
        await this.trx('dialog_sessions')
          .where({ id: oldSessionId })
          .first()
      ) {
        const newSessionId = `${convo.botId}::web::${newConvo.userId}::${newConvo.id}`
        this.sessionBatch.push({ oldId: oldSessionId, newId: newSessionId })
      }

      const messages = await this.trx('web_messages')
        .select('*')
        .where({ conversationId: convo.id })

      for (const message of messages) {
        this.messageBatch.push({
          id: uuid.v4(),
          conversationId: newConvo.id,
          authorId: message.userId ? await this.getUserId(convo.botId, message.userId, clientId) : undefined,
          sentOn: message.sent_on || defaultDate,
          payload: message.payload || defaultPayload
        })

        if (this.messageBatch.length > maxBatchSize) {
          await this.emptyMessageBatch()
        }
      }

      if (this.convoBatch.length > maxBatchSize) {
        await this.emptyConvoBatch()
      }

      if (this.sessionBatch.length > maxBatchSize) {
        await this.emptySessionBatch()
      }
    }

    await this.emptyConvoBatch()
    await this.emptyMessageBatch()
    await this.emptySessionBatch()
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
    if (this.userMapBatch.length > 0) {
      await this.trx('web_user_map').insert(this.userMapBatch)
      this.userMapBatch = []
    }

    if (this.userBatch.length > 0) {
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

    if (this.convoNewIdsBatch.length > 0) {
      await this.trx('temp_new_convo_ids').insert(this.convoNewIdsBatch)
      this.convoNewIdsBatch = []
    }
  }

  private async emptyMessageBatch() {
    await this.emptyConvoBatch()

    if (this.messageBatch.length > 0) {
      await this.trx('msg_messages').insert(this.messageBatch)
      this.messageBatch = []
    }
  }

  private async emptySessionBatch() {
    if (this.sessionBatch.length > 0) {
      for (const session of this.sessionBatch) {
        await this.trx('dialog_sessions')
          .update({ id: session.newId })
          .where({ id: session.oldId })
      }

      this.sessionBatch = []
    }
  }
}
