import * as gen from './generate-content'
import * as rewrite from './rewrite-prompt'
import * as bp from '.botpress'

const plugin = new bp.Plugin({
  actions: {},
})

plugin.hook.beforeOutgoingMessage('*', async ({ data: message, client }) => {
  if (message.type !== 'text') {
    return { data: message }
  }

  const messageText = message.payload.text as string

  const { model, personality } = plugin.config.configuration

  const prompt = rewrite.prompt({
    model,
    personality,
    payload: messageText,
  })
  const output = await gen.generateContent({
    integrationName: plugin.config.interfaces.llm.name,
    client,
    input: prompt,
  })

  const { success, json } = gen.parseLLMOutput(output)

  const parseResult = rewrite.responseSchema.safeParse(json)
  if (!success || !parseResult.success) {
    console.error('Failed to rewrite message')
    return { data: message }
  }

  message.payload.text = parseResult.data.payload
  return { data: message }
})

export default plugin
