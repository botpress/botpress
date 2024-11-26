import { z } from '@botpress/sdk'
import dedent from 'dedent'
import { LLMInput } from './generate-content'

export const responseSchema = z.object({
  payload: z.string(),
})

type PromptArgs = {
  model: string
  personality: string
  payload: string
}

const systemPrompt = (args: PromptArgs): string => dedent`
Please rewrite the below JSON messages in your own voice and personality.
Do NOT CHANGE the nature and meaning of any of the messages.
Do not add additional greetings, introduction or personality traits in the below messages.
Just change the writing style.
Preserve the numbering, ordering, meaning, casing and spacing.
Only rewrite the main message text, keep buttons and choices as-is.

Your personality is as follows:
---
${args.personality}
---
`

const userPrompt = (args: PromptArgs): string => dedent`
\`\`\`json
{ "payload": ${args.payload} }
\`\`\`

type OutputFormat = ${responseSchema.toTypescript()}
`

export const prompt = (args: PromptArgs): LLMInput => ({
  model: { id: args.model },
  responseFormat: 'json_object',
  temperature: 0,
  systemPrompt: systemPrompt(args),
  messages: [
    {
      role: 'user',
      content: userPrompt(args),
    },
  ],
})
