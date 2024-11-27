import * as gen from './generate-content'
import * as questions from './question-prompt'
import * as bp from '.botpress'

const plugin = new bp.Plugin({
  actions: {},
})

const integrationName = plugin.config.interfaces.llm.name

plugin.hook.beforeIncomingMessage('*', async ({ data: message, client, ctx }) => {
  if (message.type !== 'text') {
    return
  }

  const text: string = message.payload.text
  if (!text) {
    return
  }

  const llmInput = questions.prompt({ text, line: 'L1' })
  const llmOutput = await gen.generateContent({
    client,
    input: llmInput,
    integrationName,
  })

  const { success, json } = gen.parseLLMOutput(llmOutput)
  if (!success) {
    return
  }

  const parsedResult = questions.OutputFormat.safeParse(json)
  if (!parsedResult.success) {
    return
  }

  const { data } = parsedResult
  if (!data.hasQuestions || !data.questions?.length) {
    return
  }

  const canonicalQuestion = data.questions.map((question) => question.resolved_question).join(' ')
  const { passages } = await client.searchFiles({
    query: canonicalQuestion,
  })

  if (!passages.length) {
    return
  }

  // TODO: replace by proper answer generation
  const answer = passages.map((p) => p.content).join('\n')

  await client.createMessage({
    conversationId: message.conversationId,
    userId: ctx.botId,
    payload: {
      text: answer,
    },
    tags: {},
    type: 'text',
  })

  // TODO: allow stopping propagation for before_incoming_* hooks
  return
})

export default plugin
