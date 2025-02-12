import { InvalidPayloadError } from '@botpress/client'
import { llm } from '@botpress/common'
import { IntegrationLogger } from '@botpress/sdk'
import {
  Content,
  FinishReason,
  FunctionCall,
  FunctionCallingConfig,
  FunctionCallingMode,
  FunctionDeclarationSchema,
  GenerateContentCandidate,
  GenerateContentRequest,
  GenerateContentResponse,
  GoogleGenerativeAI,
  Part,
  Tool,
  ToolConfig,
} from '@google/generative-ai'
import crypto from 'crypto'

export async function generateContent<M extends string>(
  input: llm.GenerateContentInput,
  googleAIClient: GoogleGenerativeAI,
  logger: IntegrationLogger,
  params: {
    models: Record<M, llm.ModelDetails>
    defaultModel: M
  }
): Promise<llm.GenerateContentOutput> {
  const modelId = (input.model?.id || params.defaultModel) as M
  const model = params.models[modelId]

  const googleAIModel = googleAIClient.getGenerativeModel({ model: modelId })

  const request = await buildGenerateContentRequest(input)

  if (input.debug) {
    logger.forBot().info('Request being sent to Google AI: ' + JSON.stringify(request, null, 2))
  }

  let response: GenerateContentResponse | undefined

  try {
    ;({ response } = await googleAIModel.generateContent(request))
  } catch (err: any) {
    throw llm.createUpstreamProviderFailedError(err, `Google AI error: ${err.message}`)
  } finally {
    if (input.debug && response) {
      logger.forBot().info('Response received from Google AI: ' + JSON.stringify(response, null, 2))
    }
  }

  if (response.usageMetadata?.promptTokenCount === undefined) {
    logger.forBot().warn('Google AI did not return input token usage')
  }
  if (response.usageMetadata?.candidatesTokenCount === undefined) {
    logger.forBot().warn('Google AI did not return output token usage')
  }

  const inputTokens = response.usageMetadata?.promptTokenCount ?? 0
  const outputTokens = response.usageMetadata?.candidatesTokenCount ?? 0

  const inputCost = calculateTokenCost(model.input.costPer1MTokens, inputTokens)
  const outputCost = calculateTokenCost(model.output.costPer1MTokens, outputTokens)
  const cost = inputCost + outputCost

  const output = {
    id: crypto.randomUUID(), // Google AI doesn't provide a response ID, so we just generate a random one for simplicity.
    provider: 'google-ai',
    model: modelId,
    choices: response.candidates?.map(mapCandidate) ?? [],
    botpress: { cost },
    usage: {
      inputTokens,
      inputCost,
      outputTokens,
      outputCost,
    },
  }

  if (input.debug) {
    logger.forBot().info('Action output: ' + JSON.stringify(output, null, 2))
  }

  return output
}

async function buildGenerateContentRequest(input: llm.GenerateContentInput): Promise<GenerateContentRequest> {
  return {
    systemInstruction: input.systemPrompt,
    toolConfig: buildToolConfig(input),
    tools: buildTools(input),
    generationConfig: {
      maxOutputTokens: input.maxTokens,
      topP: input.topP,
      temperature: input.temperature,
      stopSequences: input.stopSequences,
      responseMimeType: input.responseFormat === 'json_object' ? 'application/json' : 'text/plain',
    },
    contents: await buildContents(input),
  }
}

async function buildContents(input: llm.GenerateContentInput): Promise<Content[]> {
  const content: Content[] = []

  for (const message of input.messages) {
    const parts: Part[] = []

    if (message.type === 'text' || message.type === 'multipart') {
      if (!message.content) {
        throw new InvalidPayloadError('`content` property is required when message type is "text" or "multipart"')
      }
      if (typeof message.content === 'string') {
        parts.push(await buildContentPart(message.content))
      } else if (Array.isArray(message.content)) {
        for (const content of message.content) {
          parts.push(await buildContentPart(content))
        }
      } else {
        throw new InvalidPayloadError('`content` property must be a string or an array of strings or content objects')
      }
    } else if (message.type === 'tool_calls') {
      if (!message.toolCalls) {
        throw new InvalidPayloadError('`toolCalls` is required when message type is "tool_calls"')
      }

      for (const toolCall of message.toolCalls) {
        parts.push({
          functionCall: {
            name: toolCall.function.name,
            // Google AI expects an object but we receive a Record from the LLM interface, so we can simply cast it.
            args: <object>toolCall.function.arguments,
          },
        })
      }
    } else if (message.type === 'tool_result') {
      if (!message.toolResultCallId) {
        throw new InvalidPayloadError(
          '`toolResultCallId` is required when message type is "tool_result", for Google AI it should contain the name of the function called'
        )
      }

      if (typeof message.content !== 'string') {
        throw new InvalidPayloadError('`content` must be a string when message type is "tool_result"')
      }

      let functionResponse: object

      try {
        functionResponse = JSON.parse(message.content)
      } catch (err: any) {
        throw new InvalidPayloadError(`Failed to parse \`content\` property for tool result as JSON: ${err.message}`)
      }

      if (typeof functionResponse !== 'object') {
        throw new InvalidPayloadError(
          '`content` property for tool result must be a JSON object as required by Google AI'
        )
      }

      parts.push({
        functionResponse: {
          name: message.toolResultCallId, // Note: Google AI doesn't generate tool call IDs so we just use the function name as the ID instead.
          response: functionResponse,
        },
      })
    }

    content.push({
      role: message.role,
      parts,
    })
  }

  return content
}

async function buildContentPart(
  content: NonNullable<llm.GenerateContentInput['messages'][0]['content']>[0]
): Promise<Part> {
  if (typeof content === 'string') {
    return {
      text: content,
    }
  } else if (typeof content === 'object') {
    // TODO: Support input audio content, but this will require also supporting separate pricing for input audio tokens as Google charges them at a higher rate than text/image/video tokens.
    if (content.type === 'text') {
      if (!content.text) {
        throw new InvalidPayloadError('`text` property is required when message content type is "text"')
      }
      return {
        text: content.text,
      }
    } else if (content.type === 'image') {
      if (!content.url) {
        throw new InvalidPayloadError('`url` is required when part type is "image"')
      }

      let response: Response
      let buffer: Buffer

      try {
        response = await fetch(content.url)
        buffer = Buffer.from(await response.arrayBuffer())
      } catch (err: any) {
        throw new InvalidPayloadError(
          `Failed to retrieve image in message content from the provided URL: ${content.url} (Error: ${err.message})`
        )
      }

      if (!content.mimeType) {
        const contentTypeHeader = response.headers.get('content-type')
        if (contentTypeHeader) {
          content.mimeType = contentTypeHeader
        } else {
          throw new InvalidPayloadError(
            `Could not automatically retrieve MIME type from response headers of provided image URL ${content.url}. Please provide the \`mimeType\` property in the message content for this image URL.`
          )
        }
      }

      return {
        inlineData: {
          mimeType: content.mimeType,
          data: buffer.toString('base64'),
        },
      }
    } else {
      throw new InvalidPayloadError(`Message content type "${content.type}" is invalid`)
    }
  } else {
    throw new InvalidPayloadError('Message content must be a string or an object')
  }
}

function buildToolConfig(input: llm.GenerateContentInput): ToolConfig | undefined {
  if (input.toolChoice === undefined) {
    return undefined
  }
  return {
    functionCallingConfig: buildFunctionCallingConfig(input.toolChoice),
  }
}

function buildFunctionCallingConfig(
  toolChoice: NonNullable<llm.GenerateContentInput['toolChoice']>
): FunctionCallingConfig {
  switch (toolChoice.type) {
    case 'any':
      return { mode: FunctionCallingMode.ANY }
    case 'none':
      return { mode: FunctionCallingMode.NONE }
    case 'specific':
      if (!toolChoice.functionName) {
        throw new InvalidPayloadError('Tool choice with type "specific" must provide the function name to be called')
      }
      return { allowedFunctionNames: [toolChoice.functionName] }
    case 'auto':
      return { mode: FunctionCallingMode.AUTO }
    default:
      return { mode: FunctionCallingMode.MODE_UNSPECIFIED }
  }
}

function buildTools(input: llm.GenerateContentInput): Tool[] | undefined {
  if (!input.tools) {
    return undefined
  }

  const functions = input.tools.filter((x) => x.type === 'function')

  return [
    {
      functionDeclarations: functions.map((tool) => ({
        name: tool.function.name,
        description: tool.function.description,
        // Our LLM interface receives the function arguments schema as a JSON schema while Google AI expects the function declaration parameters to be in OpenAPI format, so given that OpenAPI is a superset of JSON schema format it should be safe to pass it as-is.
        parameters: tool.function.argumentsSchema as any as FunctionDeclarationSchema,
      })),
    },
  ]
}

type Choice = llm.GenerateContentOutput['choices'][0]

function mapCandidate(candidate: GenerateContentCandidate, index: number): Choice {
  const choice = <Choice>{
    index,
    role: 'assistant',
    type: 'multipart',
    content: [],
    stopReason: mapFinishReason(candidate.finishReason),
  }

  const functionCalls = candidate.content.parts.map((x) => x.functionCall).filter((x): x is FunctionCall => !!x)
  const functionResponses = candidate.content.parts.filter((x) => !!x.functionResponse).map((x) => x.functionResponse)

  if (
    candidate.content.parts.length === 1 &&
    candidate.content.parts[0]!.text &&
    functionCalls.length === 0 &&
    functionResponses.length === 0
  ) {
    choice.type = 'text'
    choice.content = candidate.content.parts[0]!.text
    return choice
  }

  choice.content = []

  for (const part of candidate.content.parts) {
    if (part.text) {
      choice.content.push({ type: 'text', text: part.text })
    } else if (part.inlineData) {
      choice.content.push({
        type: 'image',
        url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
        mimeType: part.inlineData.mimeType,
      })
    }
  }

  if (functionCalls.length > 0) {
    choice.toolCalls = functionCalls.map((functionCall) => ({
      id: functionCall.name, // Google AI doesn't generate tool call IDs so we just use the function name as the ID.
      type: 'function',
      function: {
        name: functionCall.name,
        arguments: functionCall.args,
      },
    }))
  }

  if (functionResponses.length > 0) {
    // Function responses can be an array but in theory we only send one response at a time.
    choice.toolResultCallId = functionResponses[0]!.name
  }

  return choice
}

function mapFinishReason(finishReason: FinishReason | undefined): Choice['stopReason'] {
  switch (finishReason) {
    case FinishReason.SAFETY:
    case FinishReason.LANGUAGE:
      return 'content_filter'
    case FinishReason.MAX_TOKENS:
      return 'max_tokens'
    case FinishReason.STOP:
      return 'stop'
    case FinishReason.OTHER:
    case FinishReason.RECITATION:
    case FinishReason.FINISH_REASON_UNSPECIFIED:
    default:
      return 'other'
  }
}

function calculateTokenCost(costPer1MTokens: number, tokenCount: number) {
  return (costPer1MTokens / 1_000_000) * tokenCount
}
