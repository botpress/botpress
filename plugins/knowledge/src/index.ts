import * as gen from './generate-content'
import * as questions from './question-prompt'
import * as bp from '.botpress'

const plugin = new bp.Plugin({
  actions: {},
})

plugin.on.beforeIncomingMessage('*', async ({ data: message, client, ctx, actions }) => {
  if (message.type !== 'text') {
    console.debug('Ignoring non-text message')
    return
  }

  const text: string = message.payload.text
  if (!text) {
    console.debug('Ignoring empty message')
    return
  }

  console.debug('Extracting questions from:', text)

  const llmInput = questions.prompt({ text, line: 'L1' })
  const llmOutput = await actions.llm.generateContent(llmInput)

  const { success, json } = gen.parseLLMOutput(llmOutput)
  if (!success) {
    console.debug('Failed to extract questions')
    return
  }

  const parsedResult = questions.OutputFormat.safeParse(json)
  if (!parsedResult.success) {
    console.debug('Failed to extract questions')
    return
  }

  const { data } = parsedResult
  if (!data.hasQuestions || !data.questions?.length) {
    console.debug('No questions extracted')
    return
  }

  const canonicalQuestion = data.questions.map((question) => question.resolved_question).join(' ')

  console.debug('Searching for:', canonicalQuestion)
  const { passages } = await client.searchFiles({
    query: canonicalQuestion,
  })

  if (!passages.length) {
    console.debug('No passages found')
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

  return { stop: true }
})

export default plugin
