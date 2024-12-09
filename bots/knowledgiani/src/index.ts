import * as bp from '.botpress'

const bot = new bp.Bot({
  actions: {},
})

bot.on.message('text', async (props) => {
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

const fileKey = (url: string) => {
  const fileName = url.split('/').pop()
  if (!fileName) {
    return url
  }
  return fileName
}

bot.on.message('file', async (props) => {
  console.info('Received file message:', props.message.payload.fileUrl)

  const { fileUrl } = props.message.payload
  const key = fileKey(fileUrl)
  await props.client.uploadFile({
    key,
    url: fileUrl,
    index: true,
  })

  console.info('File uploaded:', key)
})

export default bot
