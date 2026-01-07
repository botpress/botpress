import { InvalidPayloadError } from '@botpress/client'
import { llm } from '@botpress/common'
import { IntegrationLogger } from '@botpress/sdk'
import { Mistral } from '@mistralai/mistralai'
import { ModelId } from 'src/schemas'

import type {
	Messages,
	ChatCompletionRequest,
	ChatCompletionResponse,
	Tool,
	ToolChoice,
	ToolChoiceEnum,
	ContentChunk,
	FinishReason,
	UserMessage,
	ToolCall,
} from '@mistralai/mistralai/models/components'

export async function generateContent(
	input: llm.GenerateContentInput,
	mistral: Mistral,
	logger: IntegrationLogger,
	params: {
		models: Record<ModelId, llm.ModelDetails>
		defaultModel: ModelId
	}
): Promise<llm.GenerateContentOutput> {
	let modelId = (input.model?.id || params.defaultModel) as ModelId

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

	// TODO: Investigate if this is also necessary for Mistral
	/*
	if (input.messages.length === 0) {
		// Anthropic requires at least one message, so we add one by default if none were provided.
		input.messages.push({
			type: 'text',
			role: 'user',
			content: 'Follow the instructions provided in the system prompt.',
		})
	}
	*/


	const messages: Messages[] = []

	for (const message of input.messages) {
		messages.push(await mapToMistralMessage(message))
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
		messages
	}



	let response: ChatCompletionResponse | undefined

	if (!response) {
		throw new Error("Placeholder")
	}

	// const { promptTokens: inputTokens, completionTokens: outputTokens } = response.usage
	//
	// return {
	// 	id: response.id,
	// 	provider: 'mistral-ai',
	// 	model: response.model,
	// 	choices: [
	// 	],
	// 	usage: {
	// 		inputTokens,
	// 		inputCost,
	// 		outputTokens,
	// 		outputCost,
	// 	},
	// 	botpress: {
	// 		cost, // DEPRECATED
	// 	},
	// }
}

function mapToMistralMessage(message: llm.Message): Messages {
	// Handle special messages where the role is overridden (tool calls)
	if (message.type === 'tool_result') {
		if (!message.toolResultCallId) {
			throw new InvalidPayloadError(
				'`toolResultCallId` is required when message type is "tool_result"'
			)
		}

		return {
			role: 'tool',
			toolCallId: message.toolResultCallId,
			content: message.content as string,
		}
	} else if (message.type === 'tool_calls') {
		if (!message.toolCalls || message.toolCalls.length === 0) {
			throw new InvalidPayloadError(
				'`toolCalls` must contain at least one tool call when type is "tool_calls"'
			)
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

	throw new InvalidPayloadError(
		`Message type "${message.type}" is not supported for ${message.role} messages`
	)
}

/** Map multipart content into Mistral (ContentChunk) format */
function mapMultipartContent(
	content: NonNullable<llm.Message['content']>
): ContentChunk[] {
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
		}

		else if (part.type === 'image') {
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

function mapToMistralToolChoice(toolChoice: llm.GenerateContentInput["toolChoice"]): ToolChoice | ToolChoiceEnum | undefined {
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
				type: "function",
				function: {
					name: toolChoice.functionName
				}
			}
		default:
			return undefined
	}
}
