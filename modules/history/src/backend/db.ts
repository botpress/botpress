import * as sdk from 'botpress/sdk'

import moment from 'moment'
import { isNullOrUndefined } from 'util'

export default class HistoryDb {
  knex: any

  constructor(private bp: typeof sdk) {
    this.knex = bp.database
  }

  getDistinctConversations = async (botId: string, from?: number, to?: number) => {
    const query = this.knex
      .select()
      .distinct('sessionId')
      .from('events')
      .whereNotNull('sessionId')
      .andWhere('botId', botId)

    if (from) {
      const fromDate = moment.unix(from).toDate()
      query.andWhere(this.knex.date.isBefore(fromDate, 'createdOn'))
    }
    if (to) {
      const toDate = moment.unix(to).toDate()
      query.andWhere(this.knex.date.isAfter(toDate, 'createdOn'))
    }

    const queryResults = await query
    const uniqueConversations: string[] = queryResults.map(x => x.sessionId)

    const buildConversationInfo = async c => ({ id: c, count: await this._getConversationCount(c) })
    return Promise.all(uniqueConversations.map(buildConversationInfo))
  }

  getMessagesOfConversation = async (sessionId, count, offset) => {
    const incomingMessages: sdk.IO.Event[] = await this.knex
      .select('event')
      .orderBy('createdOn', 'desc')
      .where('sessionId', sessionId)
      .andWhere('direction', 'incoming')
      .from('events')
      .offset(offset)
      .limit(count)
      .map(el => this.knex.json.get(el.event))

    let messages: sdk.IO.Event
    if (incomingMessages.length) {
      const allMessagesQuery = this.knex.select('event').from('events')
      for (const incomingMessage of incomingMessages) {
        allMessagesQuery.orWhere('incomingEventId', incomingMessage.id)
      }
      messages = await allMessagesQuery.map(el => this.knex.json.get(el.event))
    }

    const messageCount = await this._getConversationCount(sessionId)

    return { messages, messageCount }
  }

  private _getConversationCount = async (sessionId: string) => {
    const messageCountObject = await this.knex
      .from('events')
      .count()
      .where('sessionId', sessionId)

    const messageCount = messageCountObject.pop()['count(*)']

    return messageCount
  }
}
