import { z } from '@botpress/sdk'
import { LLMInput } from './generate-content'

export type OutputFormat = z.infer<typeof OutputFormat>
export const OutputFormat = z.object({
  title: z.string().describe('A fitting title for the conversation'),
  summary: z.string().describe('A short summary of the conversation'),
})

export type InputFormat = z.infer<typeof InputFormat>
export const InputFormat = z.array(z.string())

type Example = {
  output: OutputFormat
  input: InputFormat
}

const formatExample = (example: Example): string => {
  return `input: ${JSON.stringify(example.input, null, 2)}\n\noutput:${JSON.stringify(example.output, null, 2)}`
}

const formatMessages = (messages: string[]): { role: 'user' | 'assistant'; content: string }[] => {
  return messages.map((message) => ({
    content: message,
    role: 'user',
  }))
}

export type PromptArgs = {
  messages: string[]
  model: { id: string }
}
export const prompt = (args: PromptArgs): LLMInput => ({
  responseFormat: 'json_object',
  temperature: 0,
  systemPrompt: `
You are a conversation summarizer.
You will be given USER MESSAGES.

Your goal is to respond with a title and summary.

The title and summary should be returned with the following JSON format:

{
  title: "string",
  summary: "string
}

Always respond in JSON with the following format:
type OutputFormat = ${OutputFormat.toTypescriptType()}

The below example is for illustrative purposes only. Your responses will be evaluated based on the quality of the title and summary extracted.
Please only extract the summary of the following messages.
${formatExample({ input: ['I am looking to buy a used car, what would you recommend?', 'What should I look out for when buying a secondhand Toyota Matrix?', 'What price should I expect from a car manufactured in 2011?', 'What mileage should I expect from a car that was made two years ago?'], output: { title: 'Used cars', summary: 'The user is asking for advice to buy a used car' } })}
`.trim(),
  messages: formatMessages(args.messages),
  model: args.model,
})
