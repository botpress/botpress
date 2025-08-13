import { z } from '@botpress/sdk'
import { LLMInput } from './generate-content'

export type OutputFormat = z.infer<typeof OutputFormat>
export const OutputFormat = z.object({
  title: z.string().describe('A fitting title for the conversation'),
  summary: z.string().describe('A short summary of the conversation'),
})

export type InputFormat = z.infer<typeof InputFormat>
export const InputFormat = z.array(z.string())

const formatMessages = (
  messages: string[],
  context: PromptArgs['context']
): { role: 'user' | 'assistant'; content: string } => {
  return {
    role: 'user',
    content: JSON.stringify(
      { previousTitle: context.previousTitle, previousSummary: context.previousSummary, messages },
      null,
      2
    ),
  }
}

export type PromptArgs = {
  messages: string[]
  model: { id: string }
  context: { previousSummary?: string; previousTitle?: string }
}
export const createPrompt = (args: PromptArgs): LLMInput => ({
  responseFormat: 'json_object',
  temperature: 0,
  systemPrompt: `
You are a conversation summarizer.
You will be given:
- A previous title and summary
- An array of USER MESSAGES

Your task is to produce a title and summary that best describe the overall conversation.

Return your response only in valid JSON using the following type:

\`\`\`json
{
  "title": "string",   // A concise, fitting title for the conversation
  "summary": "string"  // A short summary capturing the main topic or request
}
\`\`\`

Instructions:

- Consider the previous title when creating the new one — keep it if still relevant, or update it if needed.
- Focus on the main subject of the conversation.
- Make the title short and descriptive (few words).
- Keep the summary concise (one or two sentences).
- Do not include extra commentary, formatting, or explanation outside the JSON output.

Example:

Input:

\`\`\`json
{
  "previousTitle": "Used cars",
  "previousSummary": "The user is talking abous a used Toyota Matrix",
  "messages": [
    "I am looking to buy a used car, what would you recommend?",
    "What should I look out for when buying a secondhand Toyota Matrix?",
    "What price should I expect from a car manufactured in 2011?",
    "What mileage should I expect from a car that was made two years ago?"
  ]
}
\`\`\`

Output:

\`\`\`json
{
  "title": "Used cars",
  "summary": "The user is seeking advice on purchasing a used car."
}
\`\`\`
`.trim(),
  messages: [formatMessages(args.messages, args.context)],
  model: args.model,
})

console.log(
  createPrompt({
    messages: [],
    model: { id: 'gpt-4.1-nano-2025-04-14' },
    context: { previousSummary: '', previousTitle: '' },
  }).systemPrompt
)
