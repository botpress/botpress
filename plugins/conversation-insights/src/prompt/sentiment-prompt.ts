import { z } from '@botpress/sdk'
import { LLMInput } from './parse-content'
import * as prompt from './prompt'

export type SentimentAnalysisOutput = z.infer<typeof SentimentAnalysisOutput>
export const SentimentAnalysisOutput = z.object({
  sentiment: z
    .enum(['very_negative', 'negative', 'neutral', 'positive', 'very_positive'])
    .describe('The sentiment that best describes the conversation'),
})

export const SENTIMENT_OPTIONS = SentimentAnalysisOutput.shape.sentiment.options.map((opt) => ` "${opt}" `).join('|')

export type PromptArgs = Omit<prompt.PromptArgs, 'systemPrompt'>
export const createPrompt = (args: PromptArgs): LLMInput =>
  prompt.createPrompt({
    ...args,
    systemPrompt: `
You are a conversation analyser.
You will be given:
- A previous sentiment
- An array of messages

Your task is to reply the sentiment that best describes the overall conversation.

Return your response only in valid JSON using the following type:

\`\`\`json
{
  "sentiment": ${SENTIMENT_OPTIONS},   // The latest sentiment of the conversation
}
\`\`\`

Instructions:

- Consider the previous sentiment when choosing the new one — keep it if still relevant, or update it if needed.
- Focus on the most recent sentiment of the conversation.
- Only use the available sentiments
- Do not include extra commentary, formatting, or explanation outside the JSON output.
- The messages are in order, which means the most recent ones are at the end of the list.
- Keep in mind that your own messages are included in the messages, but have the 'assistant' role

The available sentiments are: ${SENTIMENT_OPTIONS}

Examples:

Input:

\`\`\`json
{
  "messages": [
    "Context: {'previousSentiment': 'negative'}",
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
`,
  })
