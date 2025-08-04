import * as bp from '.botpress'

const bot = new bp.Bot({
  actions: {},
})

bot.on.message('*', async (props) => {
  props.logger.info('Someone sent me a message')
  props.client.createMessage({
    conversationId: props.conversation.id,
    payload: { text: 'hi' },
    tags: {},
    type: 'text',
    userId: props.ctx.botId,
  })
  props.logger.info(
    `received info: ${(await props.client.callAction({ type: 'bigoutput:big', input: {} })).output.out.length}`
  )
})

// bot.on.event('big', async (props) => {
//   props.logger.info('calling action from the integration')
// props.logger.info(`received info: ${await props.client.callAction({ type: 'bigoutput:big', input: {} })}`)
// })

export default bot
