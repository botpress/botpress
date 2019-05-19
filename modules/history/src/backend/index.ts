import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'

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
    const { from, to, botId } = req.params

    const config = (await bp.config.getModuleConfigForBot('history', botId)) as Config

    const limitDate = new Date(Date.now())
    limitDate.setDate(limitDate.getDate() - config.dataRetention)

    await cleanDatabase(bp.database, limitDate)

    const query = bp.database
      .select()
      .distinct('thread_id')
      .from('msg_history')
      .whereNotNull('thread_id')
      .andWhere('bot_id', botId)

    if (from) {
      query.andWhere('created_on', '>=', from)
    }
    if (to) {
      query.andWhere('created_on', '<=', to)
    }

    const queryResults = await query
    const uniqueConversations: string[] = queryResults.map(x => x.thread_id)

    console.log(uniqueConversations)

    const conversationInfo = await Promise.all(uniqueConversations.map(c => buildConversationInfo(bp.database, c)))

    res.send(conversationInfo)
  })

  router.get('/messages/:convId', async (req, res) => {
    const convId = req.params.convId

    const messages = await bp.database
      .select('msg_content')
      .where('thread_id', convId)
      .from('msg_history')
      .map(x => JSON.parse(x.msg_content))

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
