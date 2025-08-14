import * as gen from './parse-content'
import * as summarizer from './summary-prompt'
import * as types from './types'
import * as bp from '.botpress'

type CommonProps = types.CommonProps

type UpdateTitleAndSummaryProps = CommonProps & {
  conversation: bp.MessageHandlerProps['conversation']
  messages: string[]
}
export const updateTitleAndSummary = async (props: UpdateTitleAndSummaryProps) => {
  const prompt = summarizer.createPrompt({
    messages: props.messages,
    model: { id: props.configuration.modelId },
    context: { previousTitle: props.conversation.tags.title, previousSummary: props.conversation.tags.summary },
  })

  let attemptCount = 0
  const maxRetries = 3

  let llmOutput = await props.actions.llm.generateContent(prompt)
  let parsed = gen.parseLLMOutput(llmOutput)

  while (!parsed.success && attemptCount < maxRetries) {
    props.logger.debug(`Attempt ${attemptCount + 1}: The LLM output did not respect the schema.`, parsed.json)
    llmOutput = await props.actions.llm.generateContent(prompt)
    parsed = gen.parseLLMOutput(llmOutput)
    attemptCount++
  }

  if (!parsed.success) {
    props.logger.debug(`The LLM output did not respect the schema after ${attemptCount} retries.`, parsed.json)
    return
  }

  await props.client.updateConversation({
    id: props.conversation.id,
    tags: {
      title: parsed.json.title,
      summary: parsed.json.summary,
    },
  })
}
