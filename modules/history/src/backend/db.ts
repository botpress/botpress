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
      .andWhere({ botId })

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

    const buildConversationInfo = async c => ({ id: c, count: await this.getConversationMessageCount(c) })
    return Promise.all(uniqueConversations.map(buildConversationInfo))
  }

  getMessagesOfConversation = async (sessionId, count, offset) => {
    const incomingMessages: sdk.IO.Event[] = await this.knex
      .select('event')
      .orderBy('createdOn', 'desc')
      .where({ sessionId, direction: 'incoming' })
      .from('events')
      .offset(offset)
      .limit(count)
      .then(rows => rows.map(r => this.knex.json.get(r.event)))

    const messages = await this.knex('events')
      .whereIn('incomingEventId', incomingMessages.map(x => x.id))
      .then(rows => rows.map(r => this.knex.json.get(r.event)))

    return messages
  }

  getConversationMessageCount = async (sessionId: string) => {
    return this._getMessageCountWhere({ sessionId })
  }

  getConversationMessageGroupCount = async (sessionId: string) => {
    return this._getMessageCountWhere({ sessionId, direction: 'incoming' })
  }

  private async _getMessageCountWhere(whereParams) {
    const messageCountObject = await this.knex
      .from('events')
      .count()
      .where(whereParams)

    return messageCountObject.pop()['count(*)']
  }
}
