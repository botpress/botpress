import { z } from '@botpress/sdk'
import { LLMInput } from './parse-content'
import { Sentiment } from './sentiments'
import * as bp from '.botpress'
import * as sdk from '@botpress/sdk'

export type OutputFormat = z.infer<typeof OutputFormat>
export const OutputFormat = z.object({
  title: z.string().describe('A fitting title for the conversation'),
  summary: z.string().describe('A short summary of the conversation'),
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
    content: `Previous Sentiment: ${context.previousSentiment ?? ''}`,
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
  messages: bp.MessageHandlerProps['message'][]
  model: { id: string }
  context: { previousSentiment?: string }
  botId: string
}
export const createPrompt = (args: PromptArgs): LLMInput => ({
  responseFormat: 'json_object',
  temperature: 0,
  systemPrompt: `
You are a conversation analyser.
You will be given:
- A previous sentiment
- An array of messages

Your task is to reply the sentiment that best describes the overall conversation.

Return your response only in valid JSON using the following type:

\`\`\`json
{
  "sentiment": ${JSON.stringify(Object.keys(Sentiment))},   // The latest sentiment of the conversation
}
\`\`\`

Instructions:

- Consider the previous sentiment when choosing the new one — keep it if still relevant, or update it if needed.
- Focus on the most recent sentiment of the conversation.
- Only use the available sentiments
- Do not include extra commentary, formatting, or explanation outside the JSON output.
- The messages are in order, which means the most recent ones are at the end of the list.
- Keep in mind that your own messages are included in the messages, but have the 'assistant' role

The available sentiments are: ${JSON.stringify(Object.keys(Sentiment))}

Examples:

Input:

\`\`\`json
{
  "messages": [
    "previousSentiment: negative",
    "User: I hate your service. I want to unsubscribe right now!",
    "Bot: I understand your frustation, but there is nothing we can do",
    "User: I want a refund.",
  ]
}
\`\`\`

Output:

\`\`\`json
{
  "sentiment": "very_negative"
}
\`\`\`

Input:

\`\`\`json
{
  "messages": [
    "previousSentiment: neutral",
    "User: Hi, how could I get a premium subscription?",
    "Bot: You can get it by clicking on the link I just sent you.",
    "User: Thank you so much, your help has changed my life",
  ]
}
\`\`\`

Output:

\`\`\`json
{
  "sentiment": "very_positive"
}
\`\`\`
`.trim(),
  messages: formatMessages(args.messages, args.context, args.botId),
  model: args.model,
})

console.log(
  createPrompt({ context: { previousSentiment: 'neutral' }, messages: [], model: { id: '' }, botId: 'string' })
)

//TODO
// add botId and tag bot messages as assistant
