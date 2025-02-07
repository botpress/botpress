import { z } from '@botpress/sdk'

export const ToolCallSchema = z.object({
  id: z.string(),
  type: z.enum(['function']),
  function: z.object({
    name: z.string(),
    arguments: z
      .record(z.any())
      .nullable()
      .describe('Some LLMs may generate invalid JSON for a tool call, so this will be `null` when it happens.'),
  }),
})

export const ToolChoiceSchema = z.object({
  // TODO: remove empty value from enum once Studio issue is fixed
  type: z.enum(['auto', 'specific', 'any', 'none', '']).optional(), // note: Claude doesn't support "none" but we can simply strip out the tools when `type` is "none"
  functionName: z.string().optional().describe('Required if `type` is "specific"'),
})

export const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  type: z.enum(['text', 'tool_calls', 'tool_result', 'multipart']).default('text'),
  toolCalls: z.array(ToolCallSchema).optional().describe('Required if `type` is "tool_calls"'),
  toolResultCallId: z.string().optional().describe('Required if `type` is "tool_result"'), // note: not supported by Gemini
  content: z
    .string()
    // TODO: union types are not supported yet by the Studio, comment this out when testing via an action card in the Studio
    .or(
      z.array(
        z.object({
          type: z.enum(['text', 'image']),
          mimeType: z
            .string()
            .optional()
            .describe(
              'Indicates the MIME type of the content. If not provided it will be detected from the content-type header of the provided URL.'
            ),
          text: z.string().optional().describe('Required if part type is "text" '),
          url: z.string().optional().describe('Required if part type is "image"'),
        })
      )
    )
    // .optional() // cannot be optional because there is a bug in "@bpinternal/zui" that prevents it - Fleur
    .nullable()
    .describe(
      'Required unless `type` is "tool_call". If `type` is "multipart", this field must be an array of content objects. If `type` is "tool_result" then this field should be the result of the tool call (a plain string or a JSON-encoded array or object). If `type` is "tool_call" then the `toolCalls` field should be used instead.'
    ),
})

export const ModelRefSchema = z.object({ id: z.string() })

export const ModelSchema = ModelRefSchema.extend({
  name: z.string(),
  description: z.string(),
  tags: z.array(
    z.enum([
      'recommended',
      'deprecated',
      'general-purpose',
      'low-cost',
      'vision',
      'coding',
      'agents',
      'function-calling',
      'roleplay',
      'storytelling',
      'reasoning',
      'preview',
    ])
  ),
  input: z.object({
    maxTokens: z.number().int(),
    costPer1MTokens: z.number().describe('Cost per 1 million tokens, in U.S. dollars'),
  }),
  output: z.object({
    maxTokens: z.number().int(),
    costPer1MTokens: z.number().describe('Cost per 1 million tokens, in U.S. dollars'),
  }),
})

export const GenerateContentInputSchema = <S extends z.ZodSchema>(modelRefSchema: S) =>
  z.object({
    model: modelRefSchema.describe('Model to use for content generation').optional(),
    systemPrompt: z.string().optional().describe('Optional system prompt to guide the model'),
    messages: z.array(MessageSchema).describe('Array of messages for the model to process'),
    responseFormat: z
      .enum(['text', 'json_object'])
      .optional()
      .describe(
        'Response format expected from the model. If "json_object" is chosen, you must instruct the model to generate JSON either via the system prompt or a user message.'
      ), // note: only OpenAI and Groq support this but for other models we can just append this as an indication in the system prompt
    // note: we don't support streaming yet
    maxTokens: z.number().optional().describe('Maximum number of tokens allowed in the generated response'),
    temperature: z
      .number()
      .min(0)
      .max(2)
      // @ts-ignore
      .displayAs({ id: 'slider', params: { stepSize: 0.01, horizontal: true } })
      .default(1)
      .describe('Sampling temperature for the model. Higher values result in more random outputs.'),
    topP: z
      .number()
      .min(0)
      .max(1)
      .default(1)
      // @ts-ignore
      .displayAs({ id: 'slider', params: { stepSize: 0.01, horizontal: true } })
      .describe(
        'Top-p sampling parameter. Limits sampling to the smallest set of tokens with a cumulative probability above the threshold.'
      ), // TODO: .placeholder() from zui doesn't work, so we have to use .default() which introduces some typing issues
    // note: topK is supported by Claude and Gemini but not by OpenAI or Groq
    stopSequences: z
      .array(z.string())
      .max(4)
      .optional()
      .describe('Sequences where the model should stop generating further tokens.'),
    tools: z
      .array(
        z.object({
          type: z.literal('function'),
          function: z.object({
            name: z.string().describe('Function name'),
            description: z.string().optional(),
            argumentsSchema: z.object({}).passthrough().optional().describe('JSON schema of the function arguments'),
          }),
        })
      )
      .optional(),
    // TODO: an object with options doesn't seem to be supported by the Studio as it's not rendering correctly, the dropdown for "type" is not working and it's sending a blank value instead which causes a schema validation error unless an empty value is allowed in the `type` enum
    toolChoice: ToolChoiceSchema.optional(), // note: Gemini doesn't support this but we can just ignore it there
    userId: z.string().optional(),
    debug: z.boolean().optional().hidden().describe('Set to `true` to output debug information to the bot logs'),
    meta: z
      .object({
        promptSource: z
          .string()
          .optional()
          .describe(
            'Source of the prompt, e.g. agent/:id/:version cards/ai-generate, cards/ai-task, nodes/autonomous, etc.'
          ),
        promptCategory: z.string().optional(), // Deprecated, for backwards compatibility
        integrationName: z
          .string()
          .optional()
          .describe('Name of the integration that originally received the message that initiated this action'),
      })
      .optional()
      .hidden(),
  })

export const GenerateContentInputBaseSchema = GenerateContentInputSchema(ModelRefSchema)

export const GenerateContentOutputSchema = z.object({
  id: z.string().describe('Response ID from LLM provider'),
  provider: z.string().describe('LLM provider name'),
  model: z.string().describe('Model name'),
  choices: z.array(
    MessageSchema.omit({ role: true }).extend({
      role: z.literal('assistant'),
      index: z.number().int(),
      stopReason: z.enum(['stop', 'max_tokens', 'tool_calls', 'content_filter', 'other']),
      // note: stopSequence is supported by Claude but not by OpenAI, Groq or Gemini
    })
  ),
  usage: z.object({
    inputTokens: z.number().int().describe('Number of input tokens used by the model'),
    inputCost: z.number().describe('Cost of the input tokens received by the model, in U.S. dollars'),
    outputTokens: z.number().int().describe('Number of output tokens used by the model'),
    outputCost: z.number().describe('Cost of the output tokens generated by the model, in U.S. dollars'),
  }),
  botpress: z.object({
    cost: z.number().describe('Total cost of the content generation, in U.S. dollars'),
  }),
})
