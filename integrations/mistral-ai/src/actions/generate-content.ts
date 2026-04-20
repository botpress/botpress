import { InvalidPayloadError } from '@botpress/client'
import { llm } from '@botpress/common'
import { IntegrationLogger, z } from '@botpress/sdk'
import { Mistral } from '@mistralai/mistralai'
import type {
  Messages,
  ChatCompletionRequest,
  ChatCompletionResponse,
  Tool,
  ToolChoice,
  ToolChoiceEnum,
  ContentChunk,
  ToolCall,
  FinishReason,
} from '@mistralai/mistralai/models/components'
import {
  SDKError,
  HTTPValidationError,
  ResponseValidationError,
  HTTPClientError,
} from '@mistralai/mistralai/models/errors'
import { ModelId } from 'src/schemas'

const MistralAPIErrorSchema = z.object({
  error: z
    .object({
      message: z.string(),
      type: z.string().optional(),
      code: z.string().optional(),
    })
    .optional(),
  message: z.string().optional(), // Some errors might have message at root
  detail: z
    .array(
      z.object({
        loc: z.array(z.union([z.string(), z.number()])),
        msg: z.string(),
        type: z.string(),
      })
    )
    .optional(), // For 422 validation errors
})

export async function generateContent(
  input: llm.GenerateContentInput,
  mistral: Mistral,
  logger: IntegrationLogger,
  params: {
    models: Record<ModelId, llm.ModelDetails>
    defaultModel: ModelId
  }
): Promise<llm.GenerateContentOutput> {
  const modelId = (input.model?.id || params.defaultModel) as ModelId

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

  const messages: Messages[] = []

  // Add system prompt
  if (input.systemPrompt) {
    messages.unshift({
      role: 'system',
      content: input.systemPrompt,
    })
  }

  for (const message of input.messages) {
    messages.push(mapToMistralMessage(message))
  }

  const request: ChatCompletionRequest = {
    model: modelId,
    maxTokens: input.maxTokens ?? model.output.maxTokens,
    temperature: input.temperature,
    topP: input.topP,
    stop: input.stopSequences,
    metadata: {
      user_id: input.userId,
    },
    tools: mapToMistralTools(input),
    toolChoice: mapToMistralToolChoice(input.toolChoice),
    messages,
  }

  if (input.debug) {
    logger.forBot().info('Request being sent to Mistral: ' + JSON.stringify(request, null, 2))
  }

  let response: ChatCompletionResponse | undefined

  try {
    response = await mistral.chat.complete(request)
  } catch (thrown: unknown) {
    // Validation errors (422)
    if (thrown instanceof HTTPValidationError) {
      // err has: statusCode, body, detail[]
      if (thrown.detail && thrown.detail.length > 0) {
        const validationMessages = thrown.detail.map((d) => `${d.loc.join('.')}: ${d.msg}`).join('; ')

        if (input.debug) {
          logger.forBot().error(`Mistral validation errors: ${JSON.stringify(thrown.detail, null, 2)}`)
        }

        throw llm.createUpstreamProviderFailedError(
          thrown,
          `Mistral validation error (${thrown.statusCode}): ${validationMessages}`
        )
      }
    }

    // General SDK/API errors
    if (thrown instanceof SDKError) {
      let errorMessage = thrown.message

      // parse body for more details
      try {
        const parsedBody = JSON.parse(thrown.body)
        const parsedError = MistralAPIErrorSchema.safeParse(parsedBody)

        if (parsedError.success && parsedError.data.error) {
          errorMessage = parsedError.data.error.message

          input.debug && logger.forBot().error(`Mistral API error: ${JSON.stringify(parsedError.data, null, 2)}`)

          const errorType = parsedError.data.error.type ? ` (${parsedError.data.error.type})` : ''
          throw llm.createUpstreamProviderFailedError(
            thrown,
            `Mistral error ${thrown.statusCode}${errorType}: ${errorMessage}`
          )
        }
      } catch (parseErr) {
        const parseErrorMessage = parseErr instanceof Error ? parseErr.message : String(parseErr)
        // use basic info
        if (input.debug) {
          logger.forBot().warn(`Could not parse Mistral error body: ${thrown.body}, parse error: ${parseErrorMessage}`)
        }
      }

      throw llm.createUpstreamProviderFailedError(thrown, `Mistral error ${thrown.statusCode}: ${errorMessage}`)
    }

    // Response validation errors
    if (thrown instanceof ResponseValidationError) {
      // Response from Mistral was invalid/unexpected format
      if (input.debug) {
        logger.forBot().error(`Mistral response validation error: ${thrown.message}`)
      }

      throw llm.createUpstreamProviderFailedError(thrown, `Mistral response validation error: ${thrown.message}`)
    }

    // Network/client errors
    if (thrown instanceof HTTPClientError) {
      if (input.debug) {
        logger.forBot().error(`Mistral client error (${thrown.name}): ${thrown.message}`)
      }

      throw llm.createUpstreamProviderFailedError(thrown, `Mistral client error (${thrown.name}): ${thrown.message}`)
    }

    // unknown errors
    if (input.debug) {
      logger.forBot().error(`Unexpected error calling Mistral: ${JSON.stringify(thrown, null, 2)}`)
    }

    const error = thrown instanceof Error ? thrown : Error(String(thrown))
    throw llm.createUpstreamProviderFailedError(error, `Mistral error: ${error.message}`)
  } finally {
    if (input.debug && response) {
      logger.forBot().info('Response received from Mistral: ' + JSON.stringify(response, null, 2))
    }
  }

  // fallback to zero, as it's done in the OpenAI integration
  const inputTokens = response.usage?.promptTokens ?? 0
  const outputTokens = response.usage?.completionTokens ?? 0

  const inputCost = calculateTokenCost(model.input.costPer1MTokens, inputTokens)
  const outputCost = calculateTokenCost(model.output.costPer1MTokens, outputTokens)
  const cost = inputCost + outputCost

  return {
    id: response.id,
    provider: 'mistral-ai',
    model: response.model,
    choices: response.choices.map((choice) => ({
      role: 'assistant',
      // TODO: Investigate showing images, for now it's not supported by any other provider
      type: 'text', // Mistral can return multimodal content, but we extract text only,
      content: extractTextContent(choice.message.content),
      index: choice.index,
      stopReason: mapToStopReason(choice.finishReason),
      toolCalls: mapFromMistralToolCalls(choice.message.toolCalls, logger),
    })),
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

function mapToMistralMessage(message: llm.Message): Messages {
  // Handle special messages where the role is overridden (tool calls)
  if (message.type === 'tool_result') {
    if (!message.toolResultCallId) {
      throw new InvalidPayloadError('`toolResultCallId` is required when message type is "tool_result"')
    }

    return {
      role: 'tool',
      toolCallId: message.toolResultCallId,
      content: message.content as string,
    }
  } else if (message.type === 'tool_calls') {
    if (!message.toolCalls || message.toolCalls.length === 0) {
      throw new InvalidPayloadError('`toolCalls` must contain at least one tool call when type is "tool_calls"')
    }

    return {
      role: 'assistant',
      toolCalls: message.toolCalls.map(mapToMistralToolCall),
      // content can be omitted or null for tool call messages
    }
  }

  // Handle regular messages by role
  switch (message.role) {
    case 'user':
    case 'assistant':
      return mapStandardMessage(message)
    default:
      throw new InvalidPayloadError(`Message role "${message.role}" is not supported`)
  }
}

function mapStandardMessage(message: llm.Message): Messages {
  if (message.type === 'text') {
    if (typeof message.content !== 'string') {
      throw new InvalidPayloadError('`content` must be a string when message type is "text"')
    }

    return {
      role: message.role,
      content: message.content,
    }
  }

  if (message.type === 'multipart') {
    if (!Array.isArray(message.content)) {
      throw new InvalidPayloadError('`content` must be an array when message type is "multipart"')
    }

    return {
      role: message.role,
      content: mapMultipartContent(message.content),
    }
  }

  throw new InvalidPayloadError(`Message type "${message.type}" is not supported for ${message.role} messages`)
}

/** Map multipart content into Mistral (ContentChunk) format */
function mapMultipartContent(content: NonNullable<llm.Message['content']>): ContentChunk[] {
  if (typeof content === 'string') {
    throw new InvalidPayloadError('Content must be an array for multipart messages')
  }

  const mistralContent: ContentChunk[] = []

  for (const part of content) {
    if (part.type === 'text') {
      if (!part.text) {
        throw new InvalidPayloadError('`text` is required when part type is "text"')
      }

      mistralContent.push({
        type: 'text',
        text: part.text,
      })
    } else if (part.type === 'image') {
      if (!part.url) {
        throw new InvalidPayloadError('`url` is required when part type is "image"')
      }
      mistralContent.push({
        type: 'image_url',
        imageUrl: part.url,
      })
    }
  }

  return mistralContent
}

function mapToMistralTools(input: llm.GenerateContentInput): Tool[] | undefined {
  if (input.toolChoice?.type === 'none') {
    // Don't return any tools if tool choice was to not use any tools
    return []
  }

  const mistralTools = input.tools as Tool[] | undefined

  // note: don't send an empty tools array
  return mistralTools?.length ? mistralTools : undefined
}

function mapToMistralToolCall(toolCall: llm.ToolCall): ToolCall {
  return {
    id: toolCall.id,
    type: 'function',
    function: {
      name: toolCall.function.name,
      // Mistral expects a JSON string, not an object
      arguments: JSON.stringify(toolCall.function.arguments),
    },
  }
}

function mapToMistralToolChoice(
  toolChoice: llm.GenerateContentInput['toolChoice']
): ToolChoice | ToolChoiceEnum | undefined {
  if (!toolChoice) {
    return undefined
  }

  switch (toolChoice.type) {
    case 'any':
    case 'auto':
    case 'none':
      return <ToolChoiceEnum>toolChoice.type
    case 'specific':
      return <ToolChoice>{
        type: 'function',
        function: {
          name: toolChoice.functionName,
        },
      }
    default:
      return undefined
  }
}

function calculateTokenCost(costPer1MTokens: number, tokenCount: number) {
  return (costPer1MTokens / 1_000_000) * tokenCount
}

function mapToStopReason(mistralFinishReason: FinishReason): llm.GenerateContentOutput['choices'][0]['stopReason'] {
  switch (mistralFinishReason) {
    case 'stop':
      return 'stop'
    case 'length':
    case 'model_length':
      return 'max_tokens'
    case 'tool_calls':
      return 'tool_calls'
    case 'error':
      return 'other'
    default:
      return 'other'
  }
}

function mapFromMistralToolCalls(
  mistralToolCalls: ToolCall[] | null | undefined,
  logger: IntegrationLogger
): llm.ToolCall[] | undefined {
  if (!mistralToolCalls || mistralToolCalls.length === 0) {
    return undefined
  }
  return mistralToolCalls.reduce((toolCalls, mistralToolCall) => {
    if (!mistralToolCall.id) {
      logger.forBot().warn('Mistral returned tool call without ID, skipping')
      return toolCalls
    }
    const toolType = mistralToolCall.type || 'function' // Default to 'function' if not provided
    if (toolType !== 'function') {
      logger.forBot().warn(`Unsupported tool call type "${toolType}" from Mistral, skipping`)
      return toolCalls
    }

    let toolCallArguments: llm.ToolCall['function']['arguments']
    const rawArguments = mistralToolCall.function.arguments
    // arguments can be either string or json
    if (typeof rawArguments === 'string') {
      try {
        toolCallArguments = JSON.parse(rawArguments)
      } catch (err) {
        logger
          .forBot()
          .warn(
            `Mistral returned invalid JSON for tool call "${mistralToolCall.function.name}" arguments. ` +
              `Using null instead. Error: ${err}`
          )
        toolCallArguments = null
      }
    } else if (typeof rawArguments === 'object' && rawArguments !== null) {
      toolCallArguments = rawArguments
    } else {
      logger
        .forBot()
        .warn(
          `Mistral returned unexpected type for tool call "${mistralToolCall.function.name}" arguments: ${typeof rawArguments}. Using null instead.`
        )
      toolCallArguments = null
    }
    toolCalls.push({
      id: mistralToolCall.id,
      type: 'function',
      function: {
        name: mistralToolCall.function.name,
        arguments: toolCallArguments,
      },
    })
    return toolCalls
  }, [] as llm.ToolCall[])
}

function extractTextContent(content: string | ContentChunk[] | null | undefined): string | null {
  if (!content) {
    return null
  }
  if (typeof content === 'string') {
    return content
  }
  // content is ContentChunk[] - extract only text chunks
  return (
    content
      .filter((chunk): chunk is Extract<ContentChunk, { type: 'text' }> => chunk.type === 'text')
      .map((chunk) => chunk.text)
      .join('\n\n') || null
  )
}
