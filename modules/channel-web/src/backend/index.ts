import 'bluebird-global'
import * as sdk from 'botpress/sdk'

import api from './api'
import socket from './socket'

const onServerStarted = async (bp: typeof sdk) => {
  await api(bp)
  await socket(bp)

  /*
  const conversation = await bp.messaging.getOrCreateRecentConversation({ userId, botId })

  const payload = { type: 'text', text: 'hello bot!' }
  const message = await bp.messaging.sendIncoming(conversation.id, payload)

  const messages = await bp.messaging.getRecentMessages(conversation.id, 100)

  const recentConversations = await bp.messaging.getRecentConversations({ userId, botId }, 100)

  const conversation = await bp.messaging.createConversation({ userId, botId })
  const message = await bp.messaging.createMessage(conversation.id, undefined, undefined, 'user', {
    type: 'text',
    text: 'hey bot!'
  })
  const response = await bp.messaging.createMessage(conversation.id, undefined, undefined, 'bot', {
    type: 'text',
    text: 'hey user!'
  })

  return
  const start = new Date()
  console.log(`Start ${start}`)

  let count = 0
  for (let i = 0; i < 1000; i++) {
    const conversation = await bp.messaging.createConversation({ userId: `usr${i}`, botId: 'gggg' })

    const messageCount = Math.floor(50)
    count += messageCount * 2

    for (let j = 0; j < messageCount; j++) {
      const message = await bp.messaging.createMessage(conversation.id, '', '', 'user', { type: 'text', text: 'hello' })
      const response = await bp.messaging.createMessage(conversation.id, '', '', 'user', {
        type: 'text',
        text: 'yo wassup'
      })
    }
  }

  const end = new Date()
  console.log(`Done ${end}`)
  console.log(`Took ${end.getTime() - start.getTime()}`)
  console.log(`Added ${count}`)\

  */
}

const onModuleUnmount = async (bp: typeof sdk) => {
  bp.events.removeMiddleware('web.sendMessages')
  bp.http.deleteRouterForBot('channel-web')
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onModuleUnmount,
  definition: {
    name: 'channel-web',
    menuIcon: 'chrome_reader_mode',
    fullName: 'Web Chat',
    homepage: 'https://botpress.com',
    noInterface: true,
    plugins: [{ entry: 'WebBotpressUIInjection', position: 'overlay' }]
  }
}

export default entryPoint
