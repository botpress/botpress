import * as sdk from 'botpress/sdk'

import moment from 'moment'
import { isNullOrUndefined } from 'util'

export default class HistoryDb {
  knex: any
  messageOffset = {}
  lastQueriedSessionId = undefined

  constructor(private bp: typeof sdk) {
    this.bp = bp
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

  getNMoreMessagesOfConversation = async (count, sessionId, offset?) => {
    if (offset >= 0) {
      this.messageOffset[sessionId] = offset
    } else if (sessionId != this.lastQueriedSessionId) {
      this.lastQueriedSessionId = sessionId
      this.messageOffset[sessionId] = 0
    } else if (!this.messageOffset[sessionId]) {
      this.messageOffset[sessionId] = 0
    }

    const searchFields: Partial<sdk.IO.StoredEvent> = { sessionId: sessionId }
    const sortOrder: sdk.SortOrder = { column: 'createdOn', desc: true }
    const searchParams: sdk.EventSearchParams = {
      from: this.messageOffset[sessionId],
      count: count,
      sortOrder: [sortOrder]
    }

    const messages = await this.bp.events.findEvents(searchFields, searchParams).map(e => e.event)

    const messageCount = await this._getConversationCount(sessionId)
    this.messageOffset[sessionId] = Math.min(this.messageOffset[sessionId] + count, messageCount)

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
