import Anthropic from '@anthropic-ai/sdk'
import { MessageCreateParams, MessageCreateParamsNonStreaming } from '@anthropic-ai/sdk/resources/messages'
import { InvalidPayloadError } from '@botpress/client'
import { llm } from '@botpress/common'
import { z, IntegrationLogger } from '@botpress/sdk'
import assert from 'assert'

// Reference: https://docs.anthropic.com/en/api/errors
const AnthropicInnerErrorSchema = z.object({
  type: z.literal('error'),
  error: z.object({ type: z.string(), message: z.string() }),
})

export async function generateContent<M extends string>(
  input: llm.GenerateContentInput,
  anthropic: Anthropic,
  logger: IntegrationLogger,
  params: {
    models: Record<M, llm.ModelDetails>
    defaultModel: M
  }
): Promise<llm.GenerateContentOutput> {
  const modelId = (input.model?.id || params.defaultModel) as M
  const model = params.models[modelId]
  if (!model) {
    throw new InvalidPayloadError(
      `Model ID "${modelId}" is not allowed, supported model IDs are: ${Object.keys(params.models).join(', ')}`
    )
  }

  if (input.messages.length === 0 && !input.systemPrompt) {
    throw new InvalidPayloadError('At least one message or a system prompt is required')
  }

  if (input.maxTokens && input.maxTokens > model.output.maxTokens) {
    throw new InvalidPayloadError(
      `maxTokens must be less than or equal to ${model.output.maxTokens} for model ID "${modelId}`
    )
  }

  if (input.responseFormat === 'json_object') {
    input.systemPrompt =
      (input.systemPrompt || '') +
      '\n\nYour response must always be in valid JSON format and expressed as a JSON object.'
  }

  if (input.messages.length === 0) {
    // Anthropic requires at least one message, so we add one by default if none were provided.
    input.messages.push({
      type: 'text',
      role: 'user',
      content: 'Follow the instructions provided in the system prompt.',
    })
  }

  const messages: Anthropic.MessageParam[] = []

  for (const message of input.messages) {
    messages.push(await mapToAnthropicMessage(message))
  }

  let response: Anthropic.Messages.Message | undefined

  const request: MessageCreateParamsNonStreaming = {
    model: modelId,
    max_tokens: input.maxTokens || model.output.maxTokens,
    temperature: input.temperature,
    top_p: input.topP,
    system: input.systemPrompt,
    stop_sequences: input.stopSequences,
    metadata: {
      user_id: input.userId,
    },
    tools: mapToAnthropicTools(input),
    tool_choice: mapToAnthropicToolChoice(input.toolChoice),
    messages,
  }

  if (input.debug) {
    logger.forBot().info('Request being sent to Anthropic: ' + JSON.stringify(request, null, 2))
  }

  try {
    response = await anthropic.messages.create(request)
  } catch (err: any) {
    if (err instanceof Anthropic.APIError) {
      const parsedInnerError = AnthropicInnerErrorSchema.safeParse(err.error)
      if (parsedInnerError.success) {
        throw llm.createUpstreamProviderFailedError(
          err,
          `Anthropic error ${err.status} (${parsedInnerError.data.error.type}) - ${parsedInnerError.data.error.message}`
        )
      }
    }

    throw llm.createUpstreamProviderFailedError(err)
  } finally {
    if (input.debug && response) {
      logger.forBot().info('Response received from Anthropic: ' + JSON.stringify(response, null, 2))
    }
  }

  const { input_tokens: inputTokens, output_tokens: outputTokens } = response.usage
  const inputCost = calculateTokenCost(model.input.costPer1MTokens, inputTokens)
  const outputCost = calculateTokenCost(model.output.costPer1MTokens, outputTokens)
  const cost = inputCost + outputCost

  const content = response.content
    .filter((x): x is Anthropic.TextBlock => x.type === 'text') // Claude models only return "text" or "tool_use" blocks at the moment.
    .map((content) => content.text)
    .join('\n\n')

  return {
    id: response.id,
    provider: 'anthropic',
    model: response.model,
    choices: [
      // Claude models don't support multiple "choices" or completions, they only return one.
      {
        role: response.role,
        type: 'multipart',
        index: 0,
        stopReason: mapToStopReason(response.stop_reason),
        toolCalls: mapToToolCalls(response),
        content,
      },
    ],
    usage: {
      inputTokens,
      inputCost,
      outputTokens,
      outputCost,
    },
    botpress: {
      cost, // DEPRECATED
    },
  }
}

function calculateTokenCost(costPer1MTokens: number, tokenCount: number) {
  return (costPer1MTokens / 1_000_000) * tokenCount
}

async function mapToAnthropicMessage(message: llm.Message): Promise<Anthropic.MessageParam> {
  return {
    role: message.role,
    content: await mapToAnthropicMessageContent(message),
  }
}

async function mapToAnthropicMessageContent(message: llm.Message): Promise<Anthropic.MessageParam['content']> {
  if (message.type === 'text') {
    if (typeof message.content !== 'string') {
      throw new InvalidPayloadError('`content` must be a string when message type is "text"')
    }

    return message.content as string
  } else if (message.type === 'multipart') {
    if (!Array.isArray(message.content)) {
      throw new InvalidPayloadError('`content` must be an array when message type is "multipart"')
    }

    return await mapMultipartMessageContentToAnthropicContent(message.content)
  } else if (message.type === 'tool_calls') {
    if (!message.toolCalls) {
      throw new InvalidPayloadError('`toolCalls` is required when message type is "tool_calls"')
    } else if (message.toolCalls.length === 0) {
      throw new InvalidPayloadError('`toolCalls` must contain at least one tool call')
    }

    return message.toolCalls.map(
      (toolCall) =>
        <Anthropic.ToolUseBlockParam>{
          type: 'tool_use',
          id: toolCall.id,
          name: toolCall.function.name,
          input: toolCall.function.arguments,
        }
    )
  } else if (message.type === 'tool_result') {
    return [
      <Anthropic.ToolResultBlockParam>{
        type: 'tool_result',
        tool_use_id: message.toolResultCallId,
        content: [
          {
            type: 'text',
            text: message.content as string,
          },
        ],
      },
    ]
  } else {
    throw new InvalidPayloadError(`Message type "${message.type}" is not supported`)
  }
}

async function mapMultipartMessageContentToAnthropicContent(
  content: NonNullable<llm.Message['content']>
): Promise<Anthropic.MessageParam['content']> {
  assert(typeof content !== 'string')

  const anthropicContent: Anthropic.MessageParam['content'] = []

  for (const part of content) {
    if (part.type === 'text') {
      anthropicContent.push(<Anthropic.TextBlockParam>{
        type: 'text',
        text: part.text,
      })
    } else if (part.type === 'image') {
      if (!part.url) {
        throw new InvalidPayloadError('`url` is required when part type is "image"')
      }

      let buffer: Buffer
      try {
        const response = await fetch(part.url)
        buffer = Buffer.from(await response.arrayBuffer())

        const contentTypeHeader = response.headers.get('content-type')
        if (!part.mimeType && contentTypeHeader) {
          part.mimeType = contentTypeHeader
        }
      } catch (err: any) {
        throw new InvalidPayloadError(
          `Failed to retrieve image in message content from the provided URL: ${part.url} (Error: ${err.message})`
        )
      }

      anthropicContent.push(<Anthropic.ImageBlockParam>{
        type: 'image',
        source: {
          type: 'base64',
          media_type: part.mimeType,
          data: buffer.toString('base64'),
        },
      })
    }
  }

  return anthropicContent
}

function mapToAnthropicTools(input: llm.GenerateContentInput): Anthropic.Tool[] | undefined {
  if (input.toolChoice?.type === 'none') {
    // Don't return any tools if tool choice was to not use any tools
    return []
  }

  const anthropicTools = input.tools?.map(
    (tool) =>
      <Anthropic.Tool>{
        name: tool.function.name,
        description: tool.function.description,
        input_schema: tool.function.argumentsSchema,
      }
  )

  // note: don't send an empty tools array
  return anthropicTools?.length ? anthropicTools : undefined
}

function mapToAnthropicToolChoice(
  toolChoice: llm.GenerateContentInput['toolChoice']
): Anthropic.MessageCreateParams['tool_choice'] {
  if (!toolChoice) {
    return undefined
  }

  switch (toolChoice.type) {
    case 'any':
      return <MessageCreateParams.ToolChoiceAny>{ type: 'any' }
    case 'auto':
      return <MessageCreateParams.ToolChoiceAuto>{ type: 'auto' }
    case 'specific':
      return <MessageCreateParams.ToolChoiceTool>{
        type: 'tool',
        name: toolChoice.functionName,
      }
    case 'none': // This is handled when passing the tool list by removing all tools, as Anthropic doesn't support a "none" tool choice
    default:
      return undefined
  }
}
function mapToStopReason(
  anthropicStopReason: Anthropic.Message['stop_reason']
): llm.GenerateContentOutput['choices'][0]['stopReason'] {
  switch (anthropicStopReason) {
    case 'end_turn':
    case 'stop_sequence':
      return 'stop'
    case 'max_tokens':
      return 'max_tokens'
    case 'tool_use':
      return 'tool_calls'
    default:
      return 'other'
  }
}

function mapToToolCalls(response: Anthropic.Message): llm.ToolCall[] | undefined {
  const toolCalls = response.content.filter((x): x is Anthropic.ToolUseBlock => x.type === 'tool_use')

  return toolCalls.map((toolCall) => {
    return {
      id: toolCall.id,
      type: 'function',
      function: {
        name: toolCall.name,
        arguments: toolCall.input as llm.ToolCall['function']['arguments'],
      },
    }
  })
}
