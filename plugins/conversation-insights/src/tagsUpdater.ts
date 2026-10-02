import * as cognitive from '@botpress/cognitive'
import * as sdk from '@botpress/sdk'
import * as insightFailures from './insight-failures'
import * as gen from './prompt/parse-content'
import * as sentiment from './prompt/sentiment-prompt'
import * as summarizer from './prompt/summary-prompt'
import * as types from './types'

type CommonProps = types.CommonProps

type UpdateTitleAndSummaryProps = Omit<CommonProps, 'messages'> & {
  conversation: types.ActionableConversation
  messages: types.ActionableMessage[]
  client: cognitive.BotpressClientLike
}

const MAX_GENERATION_RETRIES = 3

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

  await props.conversation.update({
    tags: {
      title: parsedSummary.title,
      summary: parsedSummary.summary,
      sentiment: parsedSentiment.sentiment,
      isDirty: 'false',
      ...insightFailures.CLEARED_INSIGHT_FAILURE_TAGS,
    },
  })
  props.logger.info(`The AI insight was updated for conversation ${props.conversation.id}`)
}

type ParsePromptProps = {
  actions: UpdateTitleAndSummaryProps['actions']
  logger: UpdateTitleAndSummaryProps['logger']
  prompt: gen.LLMInput
  client: cognitive.BotpressClientLike
  schema: sdk.z.ZodSchema
}
const _generateContentWithRetries = async <T>(props: ParsePromptProps): Promise<T> => {
  const cognitiveClient = new cognitive.Cognitive({ client: props.client })
  let lastFailureReason = ''

  for (let attempt = 1; attempt <= MAX_GENERATION_RETRIES + 1; attempt++) {
    const llmOutput = await cognitiveClient.generateText(props.prompt)
    const parsed = gen.parseLLMOutput<T>({ schema: props.schema, output: llmOutput.output })

    if (parsed.success) {
      return parsed.json
    }

    lastFailureReason = parsed.reason
    props.logger.debug(`Attempt ${attempt}: the LLM output did not respect the schema: ${parsed.reason}`)
  }

  throw new sdk.RuntimeError(
    `The LLM output did not respect the schema after ${MAX_GENERATION_RETRIES + 1} attempts: ${lastFailureReason}`
  )
}
