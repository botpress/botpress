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
      table.string('conversation_hash')
      table.string('thread_id')
      table.string('bot_id')
      table.string('target')
      table.string('channel')
      table.jsonb('msg_content')
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
      .distinct('conversation_hash')
      .from('msg_history')
      .whereNotNull('conversation_hash')
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
    const uniqueConversations: string[] = queryResults.map(x => x.conversation_hash)

    return Promise.all(uniqueConversations.map(c => this._buildConversationInfo(c)))
  }

  getMessagesOfConversation = async convId => {
    const query_result = await this.knex
      .select('msg_content')
      .where('conversation_hash', convId)
      .from('msg_history')

    return query_result.map(el => this.knex.json.get(el.msg_content))
  }

  private _buildConversationInfo = async (convId: string) => {
    const messageCountObject = await this.knex
      .from('msg_history')
      .count()
      .where('conversation_hash', convId)

    const messageCount = messageCountObject.pop()['count(*)']

    return { id: convId, count: messageCount }
  }
}
