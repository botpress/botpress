import * as gen from './generate-content'
import * as rewrite from './rewrite-prompt'
import * as bp from '.botpress'

const plugin = new bp.Plugin({
  actions: {},
})

plugin.on.beforeOutgoingMessage('*', async ({ data: message, client }) => {
  if (message.type !== 'text') {
    console.debug('Ignoring non-text message')
    return
  }

  console.debug('Rewriting message:', message.payload.text)

  const text = message.payload.text as string

  const { model, personality } = plugin.runtime.configuration

  const prompt = rewrite.prompt({
    model,
    personality,
    payload: text,
  })
  const output = await gen.generateContent({
    integrationName: plugin.runtime.interfaces.llm.name,
    client,
    input: prompt,
  })

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
