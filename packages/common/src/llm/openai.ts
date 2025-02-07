import { InvalidPayloadError } from '@botpress/client'
import { z, IntegrationLogger } from '@botpress/sdk'
import assert from 'assert'
import OpenAI from 'openai'
import {
  ChatCompletion,
  ChatCompletionAssistantMessageParam,
  ChatCompletionContentPart,
  ChatCompletionContentPartImage,
  ChatCompletionContentPartText,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
  ChatCompletionToolChoiceOption,
  ChatCompletionToolMessageParam,
  ChatCompletionUserMessageParam,
} from 'openai/resources'
import { createUpstreamProviderFailedError } from './errors'
import { GenerateContentInput, GenerateContentOutput, ToolCall, Message, ModelDetails } from './types'

const OpenAIErrorSchema = z
  .object({
    type: z.string(),
    code: z.string(),
    message: z.string(),
    error: z
      .object({
        message: z.string(),
      })
      .optional()
      .describe('Inner error'),
    failed_generation: z.string().optional(),
  })
  .strip() // IMPORTANT: This is so we can safely log the OpenAI error log as-is, to avoid leaking other sensitive information the error response may include.

export async function generateContent<M extends string>(
  input: GenerateContentInput,
  openAIClient: OpenAI,
  logger: IntegrationLogger,
  props: {
    provider: string
    models: Record<M, ModelDetails>
    defaultModel: M
    overrideRequest?: (request: ChatCompletionCreateParamsNonStreaming) => ChatCompletionCreateParamsNonStreaming
    overrideResponse?: (
      response: OpenAI.Chat.Completions.ChatCompletion,
      request: ChatCompletionCreateParamsNonStreaming
    ) => OpenAI.Chat.Completions.ChatCompletion
  }
): Promise<GenerateContentOutput> {
  const modelId = (input.model?.id || props.defaultModel) as M
  const model = props.models[modelId]
  if (!model) {
    throw new InvalidPayloadError(
      `Model ID "${modelId}" is not allowed by this integration, supported model IDs are: ${Object.keys(
        props.models
      ).join(', ')}`
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

  const messages: ChatCompletionMessageParam[] = []
  for (const message of input.messages) {
    messages.push(await mapToOpenAIMessage(message))
  }

  if (input.systemPrompt) {
    messages.unshift({
      role: 'system',
      content: input.systemPrompt,
    })
  }

  let response: OpenAI.Chat.Completions.ChatCompletion | undefined

  let request: ChatCompletionCreateParamsNonStreaming = {
    model: modelId,
    max_tokens: input.maxTokens || undefined, // note: ignore a zero value as the Studio doesn't support empty number inputs and is defaulting this to 0
    temperature: input.temperature,
    top_p: input.topP,
    response_format: input.responseFormat === 'json_object' ? { type: 'json_object' } : undefined,
    // TODO: the Studio is adding an empty item by default in the action input form
    stop: input.stopSequences?.filter((x) => x.trim()), // don't send empty values
    user: input.userId || undefined, // don't send a blank string value
    messages,
    tool_choice: mapToOpenAIToolChoice(input.toolChoice),
    tools: mapToOpenAITools(input.tools),
  }

  if (props.overrideRequest) {
    request = props.overrideRequest(request)
  }

  if (input.debug) {
    logger.forBot().info(`Request being sent to ${props.provider}: ` + JSON.stringify(request, null, 2))
  }

  try {
    response = await openAIClient.chat.completions.create(request)
  } catch (err: any) {
    if (err instanceof OpenAI.APIError) {
      const parsedError = OpenAIErrorSchema.safeParse(err)
      if (parsedError.success) {
        if (input.debug) {
          logger.forBot().error(`Error received from ${props.provider}: ${JSON.stringify(parsedError.data, null, 2)}`)
        }

        const message = `${props.provider} error ${err.status} (${err.type}:${err.code}): ${
          parsedError.data.error?.message ?? err.message
        }`

        throw createUpstreamProviderFailedError(err, message)
      }
    }

    throw createUpstreamProviderFailedError(err, `${props.provider} error: ${err.message}`)
  } finally {
    if (input.debug && response) {
      logger.forBot().info(`Response received from ${props.provider}: ` + JSON.stringify(response, null, 2))
    }
  }

  if (props.overrideResponse) {
    response = props.overrideResponse(response, request)
  }

  const inputTokens = response.usage?.prompt_tokens || 0
  const outputTokens = response.usage?.completion_tokens || 0

  const inputCost = calculateTokenCost(model.input.costPer1MTokens, inputTokens)
  const outputCost = calculateTokenCost(model.output.costPer1MTokens, outputTokens)
  const cost = inputCost + outputCost

  return {
    id: response.id,
    provider: props.provider,
    model: response.model,
    choices: response.choices.map((choice) => ({
      role: choice.message.role,
      type: 'text', // note: OpenAI only returns text messages (TODO: investigate response format for image generation)
      content: choice.message.content,
      index: choice.index,
      stopReason: mapToStopReason(choice.finish_reason),
      toolCalls: mapToToolCalls(choice.message.tool_calls, logger, props.provider),
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

function calculateTokenCost(costPer1MTokens: number, tokenCount: number) {
  return (costPer1MTokens / 1_000_000) * tokenCount
}

async function mapToOpenAIMessage(message: Message): Promise<ChatCompletionMessageParam> {
  const content = await mapToOpenAIMessageContent(message)

  switch (message.role) {
    case 'assistant':
      if (message.type === 'tool_result') {
        if (!message.toolResultCallId) {
          throw new InvalidPayloadError('`toolResultCallId` is required when message type is "tool_result"')
        }

        return <ChatCompletionToolMessageParam>{
          role: 'tool',
          tool_call_id: message.toolResultCallId,
          content,
        }
      } else if (message.type === 'tool_calls') {
        if (!message.toolCalls) {
          throw new InvalidPayloadError('`toolCalls` is required when message type is "tool_calls"')
        } else if (message.toolCalls.length === 0) {
          throw new InvalidPayloadError('`toolCalls` must contain at least one tool call')
        }

        return <ChatCompletionAssistantMessageParam>{
          role: 'assistant',
          tool_calls: message.toolCalls.map((toolCall) => ({
            id: toolCall.id,
            type: 'function',
            function: {
              name: toolCall.function.name,
              arguments: JSON.stringify(toolCall.function.arguments),
            },
          })),
        }
      }

      return <ChatCompletionAssistantMessageParam>{
        role: 'assistant',
        content,
      }
    case 'user':
    default:
      return <ChatCompletionUserMessageParam>{
        role: 'user',
        content,
      }
  }
}

async function mapToOpenAIMessageContent(message: Message) {
  if (message.type === 'tool_calls') {
    return undefined
  }

  if (!message.content) {
    throw new InvalidPayloadError('`content` is required when message type is not "tool_calls"')
  }

  switch (message.type) {
    case 'text':
      if (typeof message.content !== 'string') {
        throw new InvalidPayloadError('`content` must be a string when message type is "text"')
      }
      return message.content as string
    case 'tool_result':
      return message.content as string
    case 'multipart':
      if (!Array.isArray(message.content)) {
        throw new InvalidPayloadError('`content` must be an array when message type is "multipart"')
      }

      return await mapMultipartMessageToOpenAIMessageParts(message.content)
    default:
      throw new InvalidPayloadError(`Message type "${message.type}" is not supported`)
  }
}

async function mapMultipartMessageToOpenAIMessageParts(
  content: NonNullable<Message['content']>
): Promise<ChatCompletionContentPart[]> {
  assert(typeof content !== 'string')

  const parts: ChatCompletionContentPart[] = []

  for (const contentPart of content) {
    switch (contentPart.type) {
      case 'text':
        if (!contentPart.text) {
          throw new InvalidPayloadError('`text` is required when part type is "text"')
        }

        parts.push(<ChatCompletionContentPartText>{ type: 'text', text: contentPart.text })

        break
      case 'image':
        if (!contentPart.url) {
          throw new InvalidPayloadError('`url` is required when part type is "image"')
        }

        // Note: As of June 2024 it seems that OpenAI doesn't support image URLs directly (they return this error: "Expected a base64-encoded data URL with an image MIME type") contrary to what they say in their documentation, so we need to fetch the image and pass it as a data URI instead.
        let buffer: Buffer
        try {
          const response = await fetch(contentPart.url)
          buffer = Buffer.from(await response.arrayBuffer())

          const contentTypeHeader = response.headers.get('content-type')
          if (!contentPart.mimeType && contentTypeHeader) {
            contentPart.mimeType = contentTypeHeader
          }
        } catch (err: any) {
          throw new InvalidPayloadError(
            `Failed to retrieve image in message content from the provided URL: ${contentPart.url} (Error: ${err.message})`
          )
        }

        parts.push(<ChatCompletionContentPartImage>{
          type: 'image_url',
          image_url: {
            url: `data:${contentPart.mimeType};base64,${buffer.toString('base64')}`,
            detail: 'auto',
          },
        })

        break
      default:
        throw new InvalidPayloadError(`Content type "${contentPart.type}" is not supported`)
    }
  }

  return parts
}

function mapToOpenAIToolChoice(
  toolChoice: GenerateContentInput['toolChoice']
): ChatCompletionToolChoiceOption | undefined {
  if (!toolChoice) {
    return undefined
  }

  switch (toolChoice.type) {
    case '': // TODO: remove once Studio issue is fixed
      return undefined
    case 'none':
      return 'none'
    case 'auto':
      return 'auto'
    case 'any':
      return 'required'
    case 'specific':
      if (!toolChoice.functionName) {
        throw new InvalidPayloadError('`functionName` is required when `toolChoice` type is "specific"')
      }
      return { type: 'function', function: { name: toolChoice.functionName } }
    default:
      throw new InvalidPayloadError(`\`toolChoice\` value of "${toolChoice.type}" is not supported`)
  }
}

function mapToOpenAITools(tools: GenerateContentInput['tools']) {
  const openAITools = tools?.map((tool) => ({
    type: tool.type,
    function: {
      name: tool.function.name,
      description: tool.function.description,
      parameters: tool.function.argumentsSchema,
    },
  }))

  // note: OpenAI doesn't allow an empty tools array
  return openAITools?.length ? openAITools : undefined
}

function mapToStopReason(
  openAIFinishReason: ChatCompletion.Choice['finish_reason']
): GenerateContentOutput['choices'][0]['stopReason'] {
  switch (openAIFinishReason) {
    case 'length':
      return 'max_tokens'
    case 'stop':
      return 'stop'
    case 'content_filter':
      return 'content_filter'
    case 'tool_calls':
      return 'tool_calls'
    default:
      return 'other'
  }
}

function mapToToolCalls(
  openAIToolCalls: ChatCompletionMessageToolCall[] | undefined,
  logger: IntegrationLogger,
  provider: string
): ToolCall[] | undefined {
  return openAIToolCalls?.reduce((toolCalls, openAIToolCall) => {
    if (openAIToolCall.type === 'function') {
      let toolCallArguments: ToolCall['function']['arguments']

      try {
        toolCallArguments = JSON.parse(openAIToolCall.function.arguments)
      } catch (err) {
        logger
          .forBot()
          .warn(
            `Received invalid JSON from ${provider} for arguments in a generateContent tool call of function "${openAIToolCall.function.name}", a \`null\` value for arguments will be passed instead - JSON parser error: ${err} / Invalid JSON received: ${openAIToolCall.function.arguments}`
          )
        toolCallArguments = null
      }

      toolCalls.push({
        id: openAIToolCall.id,
        type: openAIToolCall.type,
        function: {
          name: openAIToolCall.function.name,
          arguments: toolCallArguments,
        },
      })
    } else {
      logger.forBot().warn(`Ignored unsupported tool call type "${openAIToolCall.type}" from ${provider}`)
    }

    return toolCalls
  }, [] as ToolCall[])
}
