import { z } from '@botpress/sdk'
import { LLMInput, LLMMessage } from './generate-content'

export type ExtractedQuestion = z.infer<typeof ExtractedQuestion>
export const ExtractedQuestion = z.object({
  line: z.string().describe('The line number of the question (must be prefixed with "L")'),
  raw_question: z.string().describe('The raw question extracted from the user message'),
  resolved_question: z.string().describe('The resolved question with any missing context filled in'),
  search_query: z.string().describe('The search query that would be used to find the answer in a search engine'),
})

export type OutputFormat = z.infer<typeof OutputFormat>
export const OutputFormat = z.object({
  hasQuestions: z.boolean().describe('Whether or not questions were found in the user message'),
  questions: z
    .array(ExtractedQuestion)
    .describe('List of extracted questions, or an empty array if no questions are found')
    .optional(),
})

type Example = {
  output: Array<Omit<ExtractedQuestion, 'line'>>
  input: {
    context: string
    user_message: string
  }
}

const formatQuestionExtractorMessage = (
  text: string,
  context: string
): { user_message_line: string; message: string } => {
  const contextLines = context.split('\n').map((line, index) => `[L${index + 1}]\t ${line}`)
  const user_message_line = `L${contextLines.length + 1}`

  return {
    user_message_line,
    message: `
<CONTEXT>
${contextLines.join('\n')}
</CONTEXT>

<USER MESSAGE>
[${user_message_line}]\t ${text}
</USER MESSAGE>`.trim(),
  }
}

const makeExample = (props: Example): LLMMessage[] => {
  const { message, user_message_line } = formatQuestionExtractorMessage(props.input.user_message, props.input.context)
  return [
    {
      role: 'user',
      content: message,
    },
    {
      role: 'assistant',
      content: JSON.stringify({
        hasQuestions: props.output.length > 0,
        questions: props.output.map((o) => ({
          line: user_message_line,
          raw_question: o.raw_question,
          resolved_question: o.resolved_question,
          search_query: o.search_query,
        })),
      } satisfies OutputFormat),
    },
  ]
}

export type PromptArgs = {
  text: string
  line: string
}
export const prompt = (args: PromptArgs): LLMInput => ({
  responseFormat: 'json_object',
  temperature: 0,
  systemPrompt: `
You are a question extractor.
You will be given a USER MESSAGE and a CONTEXT of the conversation so far.
The CONTEXT should not be analyzed, only the USER MESSAGE. The purpose of the CONTEXT is to provide context for the USER MESSAGE.

Your goal is to respond with the a list of question(s) found in the USER MESSAGE, if any.
For the purpose of this task, a question is defined as any sentence that is asking for information or is seeking an answer. This includes direct questions, indirect questions, rhetorical questions, search engine queries etc.

Include the raw_question (with no modifications), the resolved_question (with any missing context filled in), and the search_query (the query that would be used to find the answer in a search engine). If no relevant context is found, the resolved_question should be the same as the raw_question.
Questions should be extracted with the following JSON format:

[
  {
    "line": 'L34',
    "raw_question": "how old is he",
    "resolved_question": "how old is he (Justin Timberlake)?",
    "search_query": "\"Justin Timberlake\" age",
  }
]

If there are no questions in the USER MESSAGE, return an empty array.

Always respond in JSON with the following format:
type OutputFormat = ${ExtractedQuestion.toTypescript()}

The below examples are for illustrative purposes only. Your responses will be evaluated based on the quality of the questions extracted.
Please extract the questions found on line L${args.line} only. If there are no questions, return an empty array.
`.trim(),
  messages: [
    ...makeExample({
      input: {
        context: `
Summary:
"""
The conversation so far is about the population of the United States.
"""

Transcript:
"""
user: how many people live in the united states?
bot: The population of the United States is 331 million people.
"""`,
        user_message: 'tell me the same for canada, japan and china',
      },
      output: [
        {
          raw_question: 'tell me the same for canada, japan and china',
          resolved_question: 'tell me the population for Canada, Japan and China',
          search_query: 'current population of Canada, Japan, China',
        },
      ],
    }),
    ...makeExample({
      input: {
        context: `
Summary:
"""
The conversation so far is about organizing an event for a company called Blue Bridge.
"""

Transcript:
"""
user: the name of the event is Night of the Stars
bot: Got it, who should I send invitations to?
"""`,
        user_message: "hmmm i'm not sure, list people in marketing and sales and i'll tell you",
      },
      output: [
        {
          raw_question: 'list people in marketing and sales',
          resolved_question: 'list people in marketing and sales (at Blue Bridge)',
          search_query: '"Blue Bridge" sales and marketing employee directory',
        },
      ],
    }),
    ...makeExample({
      input: {
        context: '',
        user_message: 'what is ptow',
      },
      output: [
        {
          raw_question: 'what is ptow',
          resolved_question: 'what is ptow?',
          search_query: 'ptow meaning',
        },
      ],
    }),
    ...makeExample({
      input: {
        context: '',
        user_message: 'sure? lets do it',
      },
      output: [],
    }),
    ...makeExample({
      input: {
        context: `
User Information:
"""
Name: Alex
Language: English
Location: United States
City: New York
"""

Transcript:
"""
user: hello!
bot: Hello! How can I help you today?
"""`,
        user_message: 'what is the weather?',
      },
      output: [
        {
          raw_question: 'what is the weather?',
          resolved_question: 'what is the weather (in New York)?',
          search_query: 'current weather in New York',
        },
      ],
    }),
    ...makeExample({
      input: {
        context: `
Transcript:
"""
user: hello!
bot: Hello! How can I help you today?
user: can you give me a list of the top 10 movies?
"""`,
        user_message: 'sorry, make it 3 after all',
      },
      output: [],
    }),
    ...makeExample({
      input: {
        context: `
Transcript:
"""
"""`,
        user_message: 'How tall is Patrick?',
      },
      output: [
        {
          raw_question: 'How tall is Patrick',
          resolved_question: 'How tall is Patrick',
          search_query: 'How tall is Patrick',
        },
      ],
    }),
    ...makeExample({
      input: {
        context: `
Transcript:
"""
user: tell me about cindy
bot: Cindy is 45 years old and is currently a software engineer at Google.
user: what is her salary?
bot: She earned $142,000 per year in 2022.
user: what about her husband?
bot: Her husband, Danny, is a doctor.
"""`,
        user_message: 'I see! I think I met him once at a party. I wonder if he make more than her',
      },
      output: [
        {
          raw_question: 'I wonder if he make more than her',
          resolved_question: 'I wonder if Danny makes more than 142,000 per year?',
          search_query: 'Danny (doctor) salary comparison to Cindy (software engineer)',
        },
      ],
    }),
    {
      role: 'user',
      content: args.text,
    },
  ],
})
