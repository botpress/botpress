import 'bluebird-global'
import * as sdk from 'botpress/sdk'

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
  // console.log(`clean database called with limit date = '${limitDate.toDateString()}' (${limitDate.getTime()})`)
  await db
    .table('msg_history')
    .where('created_on', '<', limitDate.getTime())
    .del()
}

const buildConversationInfo = async (db, threadId: string) => {
  const messageCountObject = await db
    .table('msg_history')
    .count()
    .where('thread_id', threadId)

  const messageCount = messageCountObject.pop()['count(*)']

  return { id: threadId, count: messageCount }
}

const onServerReady = async (bp: typeof sdk) => {
  const router = bp.http.createRouterForBot('history')
  const globalConfig = (await bp.config.getModuleConfig('history')) as Config

  router.get('/conversations/:from/:to', async (req, res) => {
    const from = req.params.from
    const to = req.params.to

    const limitDate = new Date(Date.now())
    limitDate.setDate(limitDate.getDate() - globalConfig.DatabaseEntryDaysToLive)

    cleanDatabase(bp.database, limitDate) // pourrait être déplacé dans un hook ou un middleware ?

    const uniqueConversations: string[] = await bp.database
      .select()
      .distinct('thread_id')
      .where('created_on', '>=', from)
      .where('created_on', '<=', to)
      .where('bot_id', req.params.botId)
      .whereNotNull('thread_id')
      .table('msg_history')
      .map(x => x.thread_id)

    const conversationInfo = await Promise.all(uniqueConversations.map(c => buildConversationInfo(bp.database, c)))

    res.send(conversationInfo)
  })

  router.get('/messages/:convId', async (req, res) => {
    const convId = req.params.convId

    const messages = await bp.database
      .select('msg_content')
      .where('thread_id', convId)
      .table('msg_history')
      .map(x => JSON.parse(x.msg_content))

    res.send(messages)
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
