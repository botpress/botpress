import Anthropic from '@anthropic-ai/sdk'
import { MessageCreateParams } from '@anthropic-ai/sdk/resources/messages'
import { llm } from '@botpress/common'
import { InvalidPayloadError } from '@botpress/client'
import { IntegrationLogger } from '@botpress/sdk/dist/integration/logger'

type ModelSpecs = llm.types.ModelCost & {
  /**
   * Maximum number of output tokens supported by the model.
   */
  outputTokensLimit: number
}

export async function generateContent<M extends string>(
  input: llm.schemas.GenerateContentInput,
  anthropic: Anthropic,
  logger: IntegrationLogger,
  params: {
    models: {
      [key in M]: ModelSpecs
    }
  }
): Promise<llm.schemas.GenerateContentOutput> {
  const modelSpecs = params.models[input.model as M]
  if (!modelSpecs) {
    throw new InvalidPayloadError(
      `Model name "${input.model}" is not allowed, supported model names are: ${Object.keys(params.models).join(', ')}`
    )
  }

  if (input.responseFormat === 'json_object') {
    input.systemPrompt =
      (input.systemPrompt || '') +
      '\n\nYour response must always be in valid JSON format and expressed as a JSON object.'
  }

  const messages: Anthropic.MessageParam[] = []

  for (const message of input.messages) {
    messages.push(await mapToAnthropicMessage(message))
  }

  let response: Anthropic.Messages.Message

  try {
    response = await anthropic.messages.create({
      model: input.model,
      max_tokens: input.maxTokens || modelSpecs.outputTokensLimit,
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
    })
  } catch (err) {
    logger.forBot().error(`generateContent action failed because Anthropic returned an error: ${JSON.stringify(err)}`)
    throw err
  }

  const { input_tokens: inputTokens, output_tokens: outputTokens } = response.usage

  const content = response.content
    .filter((x): x is Anthropic.TextBlock => x.type === 'text') // Claude models only return "text" or "tool_use" blocks at the moment.
    .map((content) => content.text)
    .join('\n\n')

  return <llm.schemas.GenerateContentOutput>{
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
      inputCost: calculateTokenCost(modelSpecs.inputCostPer1MTokens, inputTokens),
      outputTokens,
      outputCost: calculateTokenCost(modelSpecs.outputCostPer1MTokens, outputTokens),
    },
  }
}

function calculateTokenCost(costPer1MTokens: number, tokenCount: number) {
  return (costPer1MTokens / 1_000_000) * tokenCount
}

async function mapToAnthropicMessage(message: llm.schemas.Message): Promise<Anthropic.MessageParam> {
  return {
    role: message.role,
    content: await mapToAnthropicMessageContent(message),
  }
}

async function mapToAnthropicMessageContent(message: llm.schemas.Message): Promise<Anthropic.MessageParam['content']> {
  if (message.type === 'text') {
    if (typeof message.content !== 'string') {
      throw new InvalidPayloadError('`content` must be a string when message type is "text"')
    }

    return message.content as string
  } else if (message.type === 'multipart') {
    if (!Array.isArray(message.content)) {
      throw new InvalidPayloadError('`content` must be an array when message type is "multipart"')
    }

    const content: Anthropic.MessageParam['content'] = []

    for (const part of message.content) {
      if (part.type === 'text') {
        content.push(<Anthropic.TextBlockParam>{
          type: 'text',
          text: part.text,
        })
      } else if (part.type === 'image') {
        if (!part.url) {
          throw new InvalidPayloadError('`url` is required when part type is "image"')
        }

        if (!part.mimeType) {
          throw new InvalidPayloadError('`mimeType` is required when part type is "image"')
        }

        let buffer: Buffer
        try {
          buffer = await fetch(part.url).then(async (res) => Buffer.from(await res.arrayBuffer()))
        } catch (err: any) {
          throw new InvalidPayloadError(
            `Failed to retrieve image in message content from the provided URL: ${part.url} (Error: ${err.message})`
          )
        }

        content.push(<Anthropic.ImageBlockParam>{
          type: 'image',
          source: {
            type: 'base64',
            media_type: part.mimeType,
            data: buffer.toString('base64'),
          },
        })
      }
    }

    return content
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

function mapToAnthropicTools(input: llm.schemas.GenerateContentInput): Anthropic.Tool[] | undefined {
  if (input.toolChoice?.type === 'none') {
    // Don't return any tools if tool choice was to not use any tools
    return []
  }

  const anthropicTools = input.tools?.map(
    (tool) =>
      <Anthropic.Tool>{
        name: tool.function.name,
        description: tool.function.description,
        input_schema: tool.function.inputSchema,
      }
  )

  // note: don't send an empty tools array
  return anthropicTools?.length ? anthropicTools : undefined
}

function mapToAnthropicToolChoice(
  toolChoice: llm.schemas.GenerateContentInput['toolChoice']
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
): llm.schemas.GenerateContentOutput['choices'][0]['stopReason'] {
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

function mapToToolCalls(response: Anthropic.Message): llm.schemas.ToolCall[] | undefined {
  const toolCalls = response.content.filter((x): x is Anthropic.ToolUseBlock => x.type === 'tool_use')

  return toolCalls.map((toolCall) => {
    return {
      id: toolCall.id,
      type: 'function',
      function: {
        name: toolCall.name,
        arguments: toolCall.input as llm.schemas.ToolCall['function']['arguments'],
      },
    }
  })
}
