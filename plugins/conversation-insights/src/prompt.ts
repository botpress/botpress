import { z } from '@botpress/sdk'
import { LLMInput } from './parse-content'
import { Sentiment } from './sentiments'
import * as bp from '.botpress'

export type SentimentAnalysisOutput = z.infer<typeof SentimentAnalysisOutput>
export const SentimentAnalysisOutput = z.object({
  sentiment: z.string().describe('The sentiment that best describes the conversation'),
})

export type InputFormat = z.infer<typeof InputFormat>
export const InputFormat = z.array(z.string())

const formatMessages = (
  messages: PromptArgs['messages'],
  context: PromptArgs['context'],
  botId: string
): LLMInput['messages'] => {
  const contextMessage: LLMInput['messages'][0] = {
    role: 'assistant',
    content: `Context: ${JSON.stringify(context)}`,
  }

  const messagesWithUser: LLMInput['messages'] = []
  for (const message of messages) {
    if (message.type !== 'text') continue // only text is supported to analyse messages
    messagesWithUser.push({
      role: message.userId === botId ? 'assistant' : 'user',
      content: message.payload.text,
    })
  }
  return [contextMessage, ...messagesWithUser.reverse()]
}

export type PromptArgs = {
  systemPrompt: string
  messages: bp.MessageHandlerProps['message'][]
  model: { id: string }
  context: { previousSentiment?: string }
  botId: string
}
export const createPrompt = (args: PromptArgs): LLMInput => ({
  responseFormat: 'json_object',
  temperature: 0,
  systemPrompt: args.systemPrompt.trim(),
  messages: formatMessages(args.messages, args.context, args.botId),
  model: args.model,
})
