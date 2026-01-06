import { InvalidPayloadError } from '@botpress/client'
import { llm } from '@botpress/common'
import { IntegrationLogger, z } from '@botpress/sdk'
import { Mistral } from '@mistralai/mistralai'
import { ModelId } from 'src/schemas'

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
}

