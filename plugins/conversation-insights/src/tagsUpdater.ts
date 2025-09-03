import * as gen from './prompt/parse-content'
import * as sentiment from './prompt/sentiment-prompt'
import * as summarizer from './prompt/summary-prompt'
import * as types from './types'
import * as bp from '.botpress'

type CommonProps = types.CommonProps

type UpdateTitleAndSummaryProps = CommonProps & {
  conversation: bp.MessageHandlerProps['conversation']
  messages: bp.MessageHandlerProps['message'][]
}
export const updateTitleAndSummary = async (props: UpdateTitleAndSummaryProps) => {
  const summaryPrompt = summarizer.createPrompt({
    messages: props.messages,
    botId: props.ctx.botId,
    model: { id: props.configuration.modelId },
    context: { previousTitle: props.conversation.tags.title, previousSummary: props.conversation.tags.summary },
  })

  const parsedSummary = await _generateContentWithRetries<summarizer.OutputFormat>({
    actions: props.actions,
    logger: props.logger,
    prompt: summaryPrompt,
  })

  const sentimentPrompt = sentiment.createPrompt({
    messages: props.messages,
    botId: props.ctx.botId,
    context: { previousSentiment: props.conversation.tags.sentiment },
    model: { id: props.configuration.modelId },
  })

  const parsedSentiment = await _generateContentWithRetries<sentiment.SentimentAnalysisOutput>({
    actions: props.actions,
    logger: props.logger,
    prompt: sentimentPrompt,
  })

  await props.client.updateConversation({
    id: props.conversation.id,
    tags: {
      title: parsedSummary.json.title,
      summary: parsedSummary.json.summary,
      sentiment: parsedSentiment.json.sentiment,
      isDirty: 'false',
    },
  })
}

type ParsePromptProps = {
  actions: UpdateTitleAndSummaryProps['actions']
  logger: UpdateTitleAndSummaryProps['logger']
  prompt: gen.LLMInput
}
const _generateContentWithRetries = async <T>(props: ParsePromptProps): Promise<gen.PredictResponse<T>> => {
  let attemptCount = 0
  const maxRetries = 3

  let llmOutput = await props.actions.llm.generateContent(props.prompt)
  let parsed = gen.parseLLMOutput<T>(llmOutput)

  while (!parsed.success && attemptCount < maxRetries) {
    props.logger.debug(`Attempt ${attemptCount + 1}: The LLM output did not respect the schema.`, parsed.json)
    llmOutput = await props.actions.llm.generateContent(props.prompt)
    parsed = gen.parseLLMOutput<T>(llmOutput)
    attemptCount++
  }

  if (!parsed.success) {
    props.logger.debug(`The LLM output did not respect the schema after ${attemptCount} retries.`, parsed.json)
  }
  return parsed
}
