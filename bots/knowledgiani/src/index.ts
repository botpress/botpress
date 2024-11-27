import * as axios from 'axios'
import * as bp from '.botpress'

const bot = new bp.Bot({
  actions: {},
})

bot.message('text', async (props) => {
  console.info('Received text message:', props.message.payload.text)
  await props.client.createMessage({
    conversationId: props.message.conversationId,
    userId: props.ctx.botId,
    type: 'text',
    payload: {
      text: 'I dont know how to respond to that',
    },
    tags: {},
  })
})

bot.message('file', async (props) => {
  console.info('Received file message:', props.message.payload.fileUrl)
  const response = await axios.default.get(props.message.payload.fileUrl, {
    responseType: 'stream',
  })

  await props.client.uploadFile({
    key: props.message.payload.fileUrl,
    content: response.data,
    index: true,
  })
})

export default bot
