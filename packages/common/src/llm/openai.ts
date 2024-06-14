import { InvalidPayloadError } from '@botpress/client'
import { IntegrationLogger } from '@botpress/sdk/dist/integration/logger'
import OpenAI from 'openai'
import {
  ChatCompletion,
  ChatCompletionAssistantMessageParam,
  ChatCompletionContentPartImage,
  ChatCompletionContentPartText,
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
  ChatCompletionToolChoiceOption,
  ChatCompletionToolMessageParam,
  ChatCompletionUserMessageParam,
} from 'openai/resources'
import { GenerateContentInput, GenerateContentOutput, ToolCall, Message } from './schemas'

export async function generateContent(
  input: GenerateContentInput,
  openAIClient: OpenAI,
  logger: IntegrationLogger,
  params: {
    provider: string
  }
): Promise<GenerateContentOutput> {
  const messages = input.messages.map(mapToOpenAIMessage)

  if (input.systemPrompt) {
    messages.unshift({
      role: 'system',
      content: input.systemPrompt,
    })
  }

  const response = await openAIClient.chat.completions.create({
    model: input.model,
    max_tokens: input.maxTokens || undefined, // note: ignore a zero value as the Studio doesn't support empty number inputs and defaults this to 0
    temperature: input.temperature,
    top_p: input.topP,
    response_format: input.responseFormat === 'json_object' ? { type: 'json_object' } : undefined,
    // TODO: the Studio is adding an empty item by default in the action input form
    stop: input.stopSequences?.filter((x) => x.trim()), // don't send empty values
    user: input.userId || undefined, // don't send an empty value
    messages,
    tool_choice: mapToOpenAIToolChoice(input.toolChoice), // note: the action input type is
    tools: mapToOpenAITools(input.tools),
  })

  return <GenerateContentOutput>{
    id: response.id,
    provider: params.provider,
    model: response.model,
    choices: response.choices.map((choice) => ({
      role: choice.message.role,
      type: 'text', // note: OpenAI only returns text messages (TODO: investigate response format for image generation)
      content: choice.message.content,
      index: choice.index,
      stopReason: mapToStopReason(choice.finish_reason),
      toolCalls: mapToToolCalls(choice.message.tool_calls, logger),
    })),
    usage: {
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
    },
  }
}

function mapToOpenAIMessage(message: Message): ChatCompletionMessageParam {
  const content = mapToOpenAIMessageContent(message)

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
        }

        return <ChatCompletionAssistantMessageParam>{
          role: 'assistant',
          tool_calls: message.toolCalls.map((toolCall) => ({
            id: toolCall.id,
            type: 'function',
            function: {
              name: toolCall.function.name,
              arguments: toolCall.function.arguments,
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

function mapToOpenAIMessageContent(message: Message) {
  if (message.type === 'tool_calls') {
    return undefined
  }

  if (!message.content) {
    throw new InvalidPayloadError('`content` is required when message type is not "tool_calls"')
  }

  switch (message.type) {
    case 'text':
    case 'tool_result':
      return message.content as string
    case 'multipart':
      if (!Array.isArray(message.content)) {
        throw new InvalidPayloadError('`content` must be an array when message type is "multipart"')
      }
      return message.content.map((content) => {
        switch (content.type) {
          case 'text':
            if (!content.text) {
              throw new InvalidPayloadError('`text` is required when part type is "text"')
            }
            return <ChatCompletionContentPartText>{ type: 'text', text: content.text }
          case 'image':
            if (!content.url) {
              throw new InvalidPayloadError('`url` is required when part type is "image"')
            }
            return <ChatCompletionContentPartImage>{
              type: 'image_url',
              image_url: {
                url: content.url,
                detail: 'auto',
              },
            }
          default:
            throw new InvalidPayloadError(`Content type "${content.type}" is not supported`)
        }
      })
    default:
      throw new InvalidPayloadError(`Message type "${message.type}" is not supported`)
  }
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
      parameters: tool.function.inputSchema,
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
  logger: IntegrationLogger
): ToolCall[] | undefined {
  return openAIToolCalls?.reduce((toolCalls, openAIToolCall) => {
    if (openAIToolCall.type === 'function') {
      toolCalls.push({
        id: openAIToolCall.id,
        type: openAIToolCall.type,
        function: {
          name: openAIToolCall.function.name,
          arguments: openAIToolCall.function.arguments,
        },
      })
    } else {
      logger.forBot().warn(`Ignored unsupported tool call type "${openAIToolCall.type}" from OpenAI`)
    }

    return toolCalls
  }, [] as ToolCall[])
}
