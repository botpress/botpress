import 'bluebird-global'
import * as sdk from 'botpress/sdk'

const onServerStarted = async (bp: typeof sdk) => {
  bp.database.createTableIfNotExists('msg_history', table => {
    table.increments('id').primary()
    table.string('msg_content')
  })
}

const onServerReady = async (bp: typeof sdk) => {
  const router = bp.http.createRouterForBot('history')

  router.get('/conversations', async (req, res) => {
    const conversations = await bp.database
      .select('*')
      .table('msg_history')
      .map(x => JSON.parse(x.msg_content))
      .filter(msg => msg.botId === req.params.botId)
      .map(msg => msg.threadId)

    const uniqueConversations = conversations.filter((value, index) => {
      return conversations.indexOf(value) === index
    })

    res.send(uniqueConversations)
  })

  router.get('/messages/:convId', async (req, res) => {
    const convId = req.params.convId

    const messages = await bp.database
      .select('*')
      .table('msg_history')
      .map(x => JSON.parse(x.msg_content))
      .filter(msg => msg.threadId === convId)

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
    menuIcon: 'timeline'
  }
}

export default entryPoint
