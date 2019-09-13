import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import { Dictionary } from 'lodash'
import moment from 'moment'

import { MessageGroup, QueryFilters } from '../typings'

const FLAGS_TABLE_NAME = 'history_flags'
const EVENTS_TABLE_NAME = 'events'

export default class HistoryDb {
  knex: any

  constructor(private bp: typeof sdk) {
    this.knex = bp.database
  }

  initialize = async () => {
    this.knex.createTableIfNotExists(FLAGS_TABLE_NAME, table => {
      table.string('flaggedMessageId').primary()
    })
  }

  flagMessages = async (messageIds: string[]) => {
    const existingRows = await this.knex
      .select()
      .from(FLAGS_TABLE_NAME)
      .whereIn('flaggedMessageId', messageIds)
      .then(rows => rows.map(r => r.flaggedMessageId))

    const newRows = messageIds
      .filter(msgId => !existingRows.includes(msgId))
      .map(msgId => ({ flaggedMessageId: msgId }))

    await this.knex.batchInsert(FLAGS_TABLE_NAME, newRows, 30)
  }

  unflagMessages = async (messages: MessageGroup[]) => {
    await this.knex
      .del()
      .from(FLAGS_TABLE_NAME)
      .whereIn('flaggedMessageId', messages.map(m => m.userMessage.id))
  }

  async getDistinctConversations(botId: string, from?: number, to?: number): Promise<string[]> {
    const query = this.knex
      .select()
      .distinct('sessionId')
      .from(EVENTS_TABLE_NAME)
      .whereNotNull('sessionId')
      .andWhere({ botId })
      .andWhereNot('sessionId', 'like', '%benchmark%') // Those are users created when benchmarking performances

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

    return uniqueConversations
  }

  getMessagesOfConversation = async (
    sessionId: string,
    count: number,
    offset: number,
    filters: QueryFilters
  ): Promise<MessageGroup[]> => {
    const incomingMessagesQuery = this.knex
      .select('event', 'flaggedMessageId')
      .from(EVENTS_TABLE_NAME)
      .leftJoin(FLAGS_TABLE_NAME, `${EVENTS_TABLE_NAME}.incomingEventId`, `${FLAGS_TABLE_NAME}.flaggedMessageId`)
      .orderBy('createdOn', 'desc')
      .where({ sessionId, direction: 'incoming' })

    if (filters && filters.flag) {
      incomingMessagesQuery.whereNotNull(`${FLAGS_TABLE_NAME}.flaggedMessageId`)
    }

    const incomingMessageRows: any[] = await incomingMessagesQuery.offset(offset).limit(count)

    const messageGroupsMap: Dictionary<MessageGroup> = {}
    _.forEach(incomingMessageRows, r => {
      const userMessage: sdk.IO.IncomingEvent = this.knex.json.get(r.event)
      messageGroupsMap[userMessage.id] = {
        isFlagged: !!r.flaggedMessageId,
        userMessage,
        botMessages: []
      }
    })

    const outgoingMessagesRows = await this.knex(EVENTS_TABLE_NAME)
      .whereIn('incomingEventId', _.keys(messageGroupsMap))
      .andWhere({ direction: 'outgoing' })

    _.forEach(outgoingMessagesRows, r => {
      messageGroupsMap[r.incomingEventId].botMessages.push(this.knex.json.get(r.event))
    })

    const messageGroups = _.values(messageGroupsMap)

    return _.sortBy(messageGroups, (mg: MessageGroup) => moment(mg.userMessage.createdOn).unix()).reverse()
  }

  async getConversationMessageCount(sessionId: string): Promise<number> {
    return this._getMessageCountWhere({ sessionId })
  }

  getConversationMessageGroupCount = async (sessionId: string, filters: QueryFilters) => {
    return this._getMessageCountWhere({ sessionId, direction: 'incoming' }, filters)
  }

  private async _getMessageCountWhere(whereParams, filters?: QueryFilters) {
    const messageCountQuery = this.knex
      .from(EVENTS_TABLE_NAME)
      .leftJoin(FLAGS_TABLE_NAME, `${EVENTS_TABLE_NAME}.incomingEventId`, `${FLAGS_TABLE_NAME}.flaggedMessageId`)

    if (filters && filters.flag) {
      messageCountQuery.whereNotNull(`${FLAGS_TABLE_NAME}.flaggedMessageId`)
    }

    const messageCountObject = await messageCountQuery.count().where(whereParams)
    return messageCountObject.pop()['count(*)']
  }
}
