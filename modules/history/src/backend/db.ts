import * as sdk from 'botpress/sdk'

import moment from 'moment'

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

    return Promise.all(uniqueConversations.map(c => this._buildConversationInfo(c)))
  }

  getMessagesOfConversation = async convId => {
    const query_result = await this.knex
      .select('event')
      .where('sessionId', convId)
      .from('events')

    return query_result.map(el => this.knex.json.get(el.event))
  }

  private _buildConversationInfo = async (sessionId: string) => {
    const messageCountObject = await this.knex
      .from('events')
      .count()
      .where('sessionId', sessionId)

    const messageCount = messageCountObject.pop()['count(*)']

    return { id: sessionId, count: messageCount }
  }
}
