import * as cognitive from '@botpress/cognitive'
import * as sdk from '@botpress/sdk'
import * as gen from './prompt/parse-content'
import * as sentiment from './prompt/sentiment-prompt'
import * as summarizer from './prompt/summary-prompt'
import * as types from './types'
import * as bp from '.botpress'

type CommonProps = types.CommonProps

type UpdateTitleAndSummaryProps = CommonProps & {
  conversation: bp.MessageHandlerProps['conversation']
  messages: bp.MessageHandlerProps['message'][]
  client: cognitive.BotpressClientLike
}
export const updateTitleAndSummary = async (props: UpdateTitleAndSummaryProps) => {
  const summaryPrompt = summarizer.createPrompt({
    messages: props.messages,
    botId: props.ctx.botId,
    context: { previousTitle: props.conversation.tags.title, previousSummary: props.conversation.tags.summary },
  })

  const parsedSummary = await _generateContentWithRetries<summarizer.SummaryOutput>({
    actions: props.actions,
    logger: props.logger,
    prompt: summaryPrompt,
    client: props.client,
    schema: summarizer.SummaryOutput,
  })

  const sentimentPrompt = sentiment.createPrompt({
    messages: props.messages,
    botId: props.ctx.botId,
    context: { previousSentiment: props.conversation.tags.sentiment },
  })

  const parsedSentiment = await _generateContentWithRetries<sentiment.SentimentAnalysisOutput>({
    actions: props.actions,
    logger: props.logger,
    prompt: sentimentPrompt,
    client: props.client,
    schema: sentiment.SentimentAnalysisOutput,
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
  props.logger.info(`The AI insight was updated for conversation ${props.conversation.id}`)
}

type ParsePromptProps = {
  actions: UpdateTitleAndSummaryProps['actions']
  logger: UpdateTitleAndSummaryProps['logger']
  prompt: gen.LLMInput
  client: cognitive.BotpressClientLike
  schema: sdk.ZodSchema
}
const _generateContentWithRetries = async <T>(props: ParsePromptProps): Promise<gen.PredictResponse<T>> => {
  let attemptCount = 0
  const maxRetries = 3

  const cognitiveClient = new cognitive.Cognitive({ client: props.client, __experimental_beta: true })
  let llmOutput = await cognitiveClient.generateContent(props.prompt)
  let parsed = gen.parseLLMOutput<T>({ schema: props.schema, ...llmOutput.output })

  while (!parsed.success && attemptCount < maxRetries) {
    props.logger.debug(
      `Attempt ${attemptCount + 1}: The LLM output did not respect the schema. It submitted: `,
      parsed.json
    )
    llmOutput = await cognitiveClient.generateContent(props.prompt)
    parsed = gen.parseLLMOutput<T>({ schema: props.schema, ...llmOutput.output })
    attemptCount++
  }

  if (!parsed.success) {
    props.logger.debug(`The LLM output did not respect the schema after ${attemptCount} retries.`, parsed.json)
  }
  return parsed
}
