import * as sdk from '@botpress/sdk'
import * as gen from './generate-content'
import * as rewrite from './rewrite-prompt'
import * as bp from '.botpress'

const plugin = new bp.Plugin({
  actions: {
    setModel: async ({ input, states, ctx }) => {
      await states.bot.model.set(ctx.botId, {
        model: input.model.id,
        personality: input.personality,
      })
      return {}
    },
  },
})

plugin.on.beforeOutgoingMessage('*', async ({ data: message, actions, states, ctx, logger }) => {
  if (message.type !== 'text') {
    console.debug('Ignoring non-text message')
    return
  }

  console.debug('Rewriting message:', message.payload.text)

  const text = message.payload.text as string

  const { model, personality } = await states.bot.model.get(ctx.botId).catch((thrown) => {
    if (sdk.isApiError(thrown) && thrown.type === 'ResourceNotFound') {
      logger.warn('No model set for bot, skipping rewrite')
      return { model: null, personality: null }
    }
    throw thrown
  })

  if (!model || !personality) {
    return
  }

  const input = rewrite.prompt({
    model,
    personality,
    payload: text,
  })
  const output = await actions.llm.generateContent(input)

  const { success, json } = gen.parseLLMOutput(output)

  const parseResult = rewrite.responseSchema.safeParse(json)
  if (!success || !parseResult.success) {
    console.debug('Failed to rewrite message')
    return { data: message }
  }

  message.payload.text = parseResult.data.payload
  return { data: message }
})

export default plugin
