import { InvalidPayloadError } from '@botpress/client'
import { llm } from '@botpress/common'
import { IntegrationLogger } from '@botpress/sdk'
import {
  GoogleGenAI,
  GenerateContentResponse,
  Candidate,
  Content,
  Part,
  Tool,
  ToolConfig,
  FunctionCallingConfig,
  FunctionCallingConfigMode,
  FunctionCall,
  FinishReason,
  GenerateContentParameters,
  FunctionDeclaration,
} from '@google/genai'
import crypto from 'crypto'
import { DefaultModelId, DiscontinuedModelIds, ModelId } from 'src/schemas'

type ReasoningEffort = NonNullable<llm.GenerateContentInput['reasoningEffort']>

export const ThinkingModeBudgetTokens: Record<ReasoningEffort, number> = {
  dynamic: -1, // Passing this value indicates Gemini to automatically determine the reasoning effort.
  none: 0,
  low: 2048,
  medium: 8192,
  high: 16_384,
}

export async function generateContent(
  input: llm.GenerateContentInput,
  googleAIClient: GoogleGenAI,
  logger: IntegrationLogger,
  params: {
    models: Record<ModelId, llm.ModelDetails>
    defaultModel: ModelId
  }
): Promise<llm.GenerateContentOutput> {
  let modelId = (input.model?.id || params.defaultModel) as ModelId

  if (DiscontinuedModelIds.includes(<string>modelId)) {
    logger
      .forBot()
      .warn(
        `The model "${modelId}" has been discontinued, using "${DefaultModelId}" instead. Please update your bot to use the latest models from Google AI.`
      )
    modelId = DefaultModelId
    input.model = { id: modelId }
  }

  const model = params.models[modelId]

  const request = await buildGenerateContentRequest(input, modelId, model, logger)

  if (input.debug) {
    logger.forBot().info('Request being sent to Google AI: ' + JSON.stringify(request, null, 2))
  }

  let response: GenerateContentResponse | undefined

  try {
    response = await googleAIClient.models.generateContent(request)
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

async function buildGenerateContentRequest(
  input: llm.GenerateContentInput,
  modelId: ModelId,
  model: llm.ModelDetails,
  logger: IntegrationLogger
): Promise<GenerateContentParameters> {
  let maxOutputTokens: number | undefined = undefined

  if (input.maxTokens) {
    if (input.maxTokens <= model.output.maxTokens) {
      maxOutputTokens = input.maxTokens
    } else {
      maxOutputTokens = model.output.maxTokens
      logger
        .forBot()
        .warn(
          `Received maxTokens parameter greater than the maximum output tokens allowed for model "${modelId}", capping maxTokens to ${maxOutputTokens}`
        )
    }
  }

  const thinkingBudget = ThinkingModeBudgetTokens[input.reasoningEffort ?? 'none'] // Default to not use reasoning as Gemini 2.5+ models use optional reasoning
  const modelSupportsThinking = modelId !== 'models/gemini-2.0-flash' // Gemini 2.0 doesn't support thinking mode

  return {
    model: modelId,
    contents: await buildContents(input),
    config: {
      systemInstruction: input.systemPrompt,
      toolConfig: buildToolConfig(input),
      tools: buildTools(input),
      maxOutputTokens,
      thinkingConfig: modelSupportsThinking
        ? {
            thinkingBudget,
            includeThoughts: false,
          }
        : undefined,
      topP: input.topP,
      temperature: input.temperature,
      stopSequences: input.stopSequences,
      responseMimeType: input.responseFormat === 'json_object' ? 'application/json' : 'text/plain',
    },
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
            args: toolCall.function.arguments ?? undefined,
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

      let functionResponse: Record<string, unknown>

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

    let role = message.role
    if (input.model!.id !== <ModelId>'models/gemini-2.0-flash' && role === 'assistant') {
      // Google AI requires the "model" role instead of "assistant" as of Gemini 2.5 (see: https://ai.google.dev/api/caching#Content)
      role = 'model' as any
    }

    content.push({
      role,
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
      return { mode: FunctionCallingConfigMode.ANY }
    case 'none':
      return { mode: FunctionCallingConfigMode.NONE }
    case 'specific':
      if (!toolChoice.functionName) {
        throw new InvalidPayloadError('Tool choice with type "specific" must provide the function name to be called')
      }
      return { allowedFunctionNames: [toolChoice.functionName] }
    case 'auto':
      return { mode: FunctionCallingConfigMode.AUTO }
    default:
      return { mode: FunctionCallingConfigMode.MODE_UNSPECIFIED }
  }
}

function buildTools(input: llm.GenerateContentInput): Tool[] | undefined {
  if (!input.tools) {
    return undefined
  }

  const functions = input.tools.filter((x) => x.type === 'function')

  return [
    {
      functionDeclarations: functions.map(
        (tool) =>
          ({
            name: tool.function.name,
            description: tool.function.description,
            // Our LLM interface receives the function arguments schema as a JSON schema while Google AI expects the function declaration parameters to be in OpenAPI format, so given that OpenAPI is a superset of JSON schema format it should be safe to pass it as-is.
            parameters: tool.function.argumentsSchema,
          }) satisfies FunctionDeclaration
      ),
    },
  ]
}

type Choice = llm.GenerateContentOutput['choices'][0]

function mapCandidate(candidate: Candidate, index: number): Choice {
  const choice = <Choice>{
    index,
    role: 'assistant',
    type: 'multipart',
    content: [],
    stopReason: mapFinishReason(candidate.finishReason),
  }

  const functionCalls = candidate.content?.parts?.map((x) => x.functionCall).filter((x): x is FunctionCall => !!x) ?? []
  const functionResponses =
    candidate.content?.parts?.filter((x) => !!x.functionResponse).map((x) => x.functionResponse) ?? []

  if (
    candidate.content?.parts?.length === 1 &&
    candidate.content.parts[0]!.text &&
    functionCalls.length === 0 &&
    functionResponses.length === 0
  ) {
    choice.type = 'text'
    choice.content = candidate.content.parts[0]!.text
    return choice
  }

  choice.content = []

  for (const part of candidate.content?.parts ?? []) {
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
    choice.toolCalls = functionCalls
      .filter((functionCall) => functionCall.name)
      .map((functionCall) => ({
        id: functionCall.id ?? functionCall.name!, // name is guaranteed by filter
        type: 'function',
        function: {
          name: functionCall.name!,
          arguments: functionCall.args ?? {},
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
