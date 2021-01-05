import * as sdk from 'botpress/sdk'

export class MessagingDB {
  constructor(private knex: sdk.KnexExtended) {

  }

  public async addConversation(conversation: sdk.Conversation) {
    const uid = Math.random()
      .toString()
      .substr(2, 6)
    const title = `Conversation ${uid}`

    await this.knex('conversations')
      .insert({
        userId: conversation.endpoint.userId,
        botId: conversation.endpoint.botId,
        title,
        created_on: this.knex.date.now(),
        last_heard_on: this.knex.date.now(),
        // last_heard_on: originatesFromUserMessage ? this.knex.date.now() : undefined,
      })
      .then()

    const insertedRow = await this.knex('conversations')
      .where({ title, userId: conversation.endpoint.userId, botId: conversation.endpoint.botId })
      .select('id')
      .then()
      .get(0)

    conversation.id = insertedRow?.id
  }
}