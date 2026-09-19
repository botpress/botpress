import 'dotenv/config'
import {
  Cognitive,
  type CognitiveRequest,
  type CognitiveResponse,
  type CognitiveStreamChunk,
  type CognitiveTool,
  type CognitiveToolCall,
  type Model,
} from '@botpress/cognitive'
import assert from 'node:assert/strict'
import { test } from 'node:test'

// Run with pnpm test:cognitive. Requires CLOUD_BOT_ID and CLOUD_PAT (or a local .env).
// Tests all current text models. Narrow with COGNITIVE_TEST_MODELS=model-one,model-two.
const { CLOUD_BOT_ID: botId, CLOUD_PAT: token, CLOUD_API_ENDPOINT: apiUrl } = process.env

assert.ok(botId, 'Set CLOUD_BOT_ID before running this live test.')
assert.ok(token, 'Set CLOUD_PAT before running this live test.')

const cognitive = new Cognitive({ apiUrl, botId, token })
const models = await getModels()

assert.ok(models.length > 0, 'No models selected. Check the catalog or COGNITIVE_TEST_MODELS.')

console.info(`Testing ${models.length} models with single and multiple calls in both streaming modes, sequentially.`)

async function getModels(): Promise<string[]> {
  const requestedModels = process.env.COGNITIVE_TEST_MODELS

  if (requestedModels !== undefined) {
    return [
      ...new Set(
        requestedModels
          .split(',')
          .map((model) => model.trim())
          .filter(Boolean)
      ),
    ].sort()
  }

  const catalog = await cognitive.listModels().catch((error) => {
    throw redactError(error)
  })
  const selectedModels: string[] = []
  const mediaTags: Model['tags'] = ['speech-to-text', 'text-to-speech', 'image-generation', 'image-editing']

  for (const model of catalog) {
    if (model.lifecycle === 'discontinued') {
      console.info(`Excluded ${model.id}: discontinued; requests redirect to a replacement.`)
      continue
    }

    if (model.tags.some((tag) => mediaTags.includes(tag))) {
      console.info(`Excluded ${model.id}: speech or image model.`)
      continue
    }

    selectedModels.push(model.id)
  }

  return [...new Set(selectedModels)].sort()
}

function redactError(error: unknown): Error {
  // Avoid dumping transport objects, which can contain authentication headers.
  const message = error instanceof Error ? error.message : String(error)
  return new Error(message.replaceAll(token!, '[REDACTED]'))
}

const numberTool: CognitiveTool = {
  name: 'record_number',
  description: 'Record a number.',
  parameters: {
    type: 'object',
    properties: { value: { type: 'number' } },
    required: ['value'],
    additionalProperties: false,
  },
}
const labelTool: CognitiveTool = {
  name: 'record_label',
  description: 'Record a label independently of recording a number.',
  parameters: {
    type: 'object',
    properties: { label: { type: 'string' } },
    required: ['label'],
    additionalProperties: false,
  },
}
const scenarios = [
  {
    name: 'single tool',
    prompt: 'Call record_number with value 42.',
    tools: [numberTool],
    expectedCalls: [{ name: 'record_number', input: { value: 42 } }],
    parallel: false,
  },
  {
    name: 'multiple tools',
    prompt:
      'In one response, call record_number with value 42 and record_label with label "ready". ' +
      'These actions are independent. Emit both native tool calls together, exactly once each, ' +
      'without waiting for either result.',
    tools: [numberTool, labelTool],
    expectedCalls: [
      { name: 'record_number', input: { value: 42 } },
      { name: 'record_label', input: { label: 'ready' } },
    ],
    parallel: true,
  },
]

for (const model of models) {
  for (const scenario of scenarios) {
    for (const streaming of [false, true]) {
      const mode = streaming ? 'streaming' : 'non-streaming'

      await test(`${model} — ${scenario.name} — ${mode}`, { timeout: 65_000 }, async (context) => {
        const request: CognitiveRequest = {
          model,
          messages: [{ role: 'user', content: scenario.prompt }],
          tools: scenario.tools,
          toolControl: { mode: 'required', parallel: scenario.parallel },
          maxTokens: 1_600,
          options: { skipCache: true },
        }
        const options = { signal: AbortSignal.timeout(60_000) }
        let response: CognitiveResponse | CognitiveStreamChunk | undefined
        let restarts = 0

        try {
          if (streaming) {
            // Tool calls are on the final chunk; consume the complete stream.
            for await (const chunk of cognitive.generateTextStream(request, options)) {
              if (chunk.restart) {
                restarts++
              }

              response = chunk
            }
          } else {
            response = await cognitive.generateText(request, options)
          }
        } catch (error) {
          throw redactError(error)
        }

        assert.ok(response, 'Cognitive returned no response.')

        const { metadata, toolCalls } = response

        context.diagnostic(
          JSON.stringify({
            requestId: metadata?.requestId,
            provider: metadata?.provider,
            model: metadata?.model,
            cached: metadata?.cached,
            fallbackPath: metadata?.fallbackPath,
            warnings: metadata?.warnings,
            stopReason: metadata?.stopReason,
            output: response.output,
            toolCalls,
          })
        )

        assert.equal(response.error, undefined, 'Cognitive returned an error.')

        if (streaming) {
          assert.ok('finished' in response && response.finished, 'The stream did not finish.')
        }

        await context.test('native tool calls', () => {
          assert.equal(toolCalls?.length, scenario.expectedCalls.length, 'Wrong number of native tool calls.')
          assert.ok(toolCalls, 'Cognitive returned no tool calls.')

          for (const call of toolCalls) {
            assert.ok(call.id?.trim(), 'A tool call has no ID.')
          }

          const callIds = new Set(toolCalls.map((call) => call.id))

          assert.equal(callIds.size, toolCalls.length, 'Tool call IDs must be unique within the response.')

          // Independent calls may arrive in either order.
          for (const expected of scenario.expectedCalls) {
            const call: CognitiveToolCall | undefined = toolCalls.find((candidate) => candidate.name === expected.name)

            assert.ok(call, `Missing native call to ${expected.name}.`)
            assert.deepEqual(call.input, expected.input, `Incorrect arguments for ${expected.name}.`)
          }
        })

        await context.test('fresh requested route', () => {
          assert.ok(metadata, 'Cognitive returned no metadata.')
          assert.equal(metadata.model, model, 'The gateway used a different model.')
          assert.equal(metadata.cached, false, 'Expected a fresh provider response.')
          assert.deepEqual(metadata.fallbackPath ?? [], [], 'The gateway fell back to another route.')
          assert.equal(restarts, 0, 'The stream restarted on another attempt.')
        })
      })
    }
  }
}
