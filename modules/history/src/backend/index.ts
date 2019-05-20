import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import moment from 'moment'

import { Config } from '../config'

const onServerStarted = async (bp: typeof sdk) => {
  bp.database.createTableIfNotExists('msg_history', table => {
    table.increments('id').primary()
    table.date('created_on')
    table.string('thread_id')
    table.string('bot_id')
    table.string('msg_content')
  })
}

const cleanDatabase = async (db, limitDate: Date) => {
  await db
    .from('msg_history')
    .where('created_on', '<', limitDate.getTime())
    .del()
}

const buildConversationInfo = async (db, threadId: string) => {
  const messageCountObject = await db
    .from('msg_history')
    .count()
    .where('thread_id', threadId)

  const messageCount = messageCountObject.pop()['count(*)']

  return { id: threadId, count: messageCount }
}

const onServerReady = async (bp: typeof sdk) => {
  const router = bp.http.createRouterForBot('history')

  router.get('/conversations', async (req, res) => {
    const { botId } = req.params
    const { from, to } = req.query

    const config = (await bp.config.getModuleConfigForBot('history', botId)) as Config

    const limitDate = moment().subtract(config.dataRetention, 'months')
    await cleanDatabase(bp.database, limitDate.toDate())

    const query = bp.database
      .select()
      .distinct('thread_id')
      .from('msg_history')
      .whereNotNull('thread_id')
      .andWhere('bot_id', botId)

    if (from) {
      const fromDate = moment.unix(from).toDate()
      query.andWhere(bp.database.date.isBefore(fromDate, 'created_on'))
    }
    if (to) {
      const toDate = moment.unix(to).toDate()
      query.andWhere(bp.database.date.isAfter(toDate, 'created_on'))
    }

    const queryResults = await query
    const uniqueConversations: string[] = queryResults.map(x => x.thread_id)

    const conversationInfo = await Promise.all(uniqueConversations.map(c => buildConversationInfo(bp.database, c)))

    res.send(conversationInfo)
  })

  router.get('/messages/:convId', async (req, res) => {
    const convId = req.params.convId

    const query_result = await bp.database
      .select('msg_content')
      .where('thread_id', convId)
      .from('msg_history')

    const messages = query_result.map(el => bp.database.json.get(el.msg_content))

    const messageGroupKeyBuild = msg =>
      msg.direction === 'incoming' ? msg.id : (msg as sdk.IO.OutgoingEvent).incomingEventId
    const messageGroups = _.groupBy(messages, messageGroupKeyBuild)
    const messageGroupsArray = _.values(messageGroups)

    res.send(messageGroupsArray)
  })
}

const onBotMount = async (bp: typeof sdk) => {}

const onBotUnmount = async (bp: typeof sdk) => {}

const onModuleUnmount = async (bp: typeof sdk) => {}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerReady,
  onServerStarted,
  onBotMount,
  onBotUnmount,
  onModuleUnmount,
  definition: {
    name: 'history',
    fullName: 'History',
    homepage: 'https://botpress.io',
    menuIcon: 'history'
  }
}

export default entryPoint
