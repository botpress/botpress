import * as sdk from 'botpress/sdk'

import moment from 'moment'

export default class HistoryDb {
  knex: any

  constructor(private bp: typeof sdk) {
    this.knex = bp['database']
  }

  initialize() {
    this.knex.createTableIfNotExists('msg_history', table => {
      table.increments('id').primary()
      table.date('created_on')
      table.string('thread_id')
      table.string('bot_id')
      table.string('msg_content')
    })
  }

  cleanDatabase = async (limitDate: Date) => {
    await this.knex
      .from('msg_history')
      .where(this.knex.date.isBefore('created_on', limitDate))
      .del()
  }

  getDistinctConversations = async (botId: string, from?: number, to?: number) => {
    const query = this.knex
      .select()
      .distinct('thread_id')
      .from('msg_history')
      .whereNotNull('thread_id')
      .andWhere('bot_id', botId)

    if (from) {
      const fromDate = moment.unix(from).toDate()
      query.andWhere(this.knex.date.isBefore(fromDate, 'created_on'))
    }
    if (to) {
      const toDate = moment.unix(to).toDate()
      query.andWhere(this.knex.date.isAfter(toDate, 'created_on'))
    }

    const queryResults = await query
    const uniqueConversations: string[] = queryResults.map(x => x.thread_id)

    const conversationsInfo = await Promise.all(uniqueConversations.map(c => this._buildConversationInfo(c)))

    return conversationsInfo
  }

  getMessagesOfConversation = async convId => {
    const query_result = await this.knex
      .select('msg_content')
      .where('thread_id', convId)
      .from('msg_history')

    const messages = query_result.map(el => this.knex.json.get(el.msg_content))

    return messages
  }

  private _buildConversationInfo = async (threadId: string) => {
    const messageCountObject = await this.knex
      .from('msg_history')
      .count()
      .where('thread_id', threadId)

    const messageCount = messageCountObject.pop()['count(*)']

    return { id: threadId, count: messageCount }
  }
}
