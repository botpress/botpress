import type { CognitiveRequest, CognitiveMetadata, CognitiveToolCall } from '@botpress/cognitive'
import { describe, expect, it } from 'vitest'

import { getNativeSystemMessage } from '../src/prompts/native.js'
import {
  RUN_JAVASCRIPT_TOOL,
  transcriptToNativeMessages,
  validateNativeToolCalls,
} from '../src/runtime/native-tools.js'

import { cases, client, expectAllowedRestart, expectModelRoute, models } from './__tests__/model-evaluation.js'
import { protocolScenario, protocolScenarios } from './__tests__/protocol-scenarios.js'

// No execution repair, cache, or test retry. With optional provider fallback,
// this measures the first response from the successful attempt, not the primary model alone.
describe.skipIf(!models.length).each(cases.length ? cases : [{ model: 'disabled', run: 1 }])(
  'first-response protocol: $model, sample $run',
  ({ model, run }) => {
    it.each(protocolScenarios.flatMap((question) => [false, true].map((streaming) => ({ question, streaming }))))(
      '$question (streaming=$streaming)',
      { retry: 0, timeout: 60000 },
      async ({ question, streaming }) => {
        const { messages: input, ...props } = protocolScenario(question)
        const system = await getNativeSystemMessage(props)
        const messages = [system.message, ...transcriptToNativeMessages(input)]
        const request: CognitiveRequest = {
          model,
          temperature: 0.7,
          reasoningEffort: 'none',
          maxTokens: 1200,
          tools: [RUN_JAVASCRIPT_TOOL],
          toolControl: { mode: 'auto', parallel: false },
          options: { skipCache: true },
          messages,
        }
        let output = ''
        let toolCalls: CognitiveToolCall[] = []
        let metadata: CognitiveMetadata | undefined
        if (streaming) {
          for await (const chunk of client.generateTextStream(request)) {
            if (chunk.restart) {
              expectAllowedRestart(chunk.restart)
              output = ''
              toolCalls = []
              metadata = undefined
            }
            output += chunk.output ?? ''
            toolCalls = chunk.toolCalls ?? toolCalls
            metadata = chunk.metadata ?? metadata
          }
        } else {
          const response = await client.generateText(request)
          output = response.output
          toolCalls = response.toolCalls ?? []
          metadata = response.metadata
        }
        const parsed = validateNativeToolCalls(toolCalls)
        console.info(
          JSON.stringify({
            model,
            run,
            question,
            streaming,
            output,
            toolCalls,
            metadata,
            errors: parsed.valid ? [] : parsed.errors,
          })
        )
        expectModelRoute(metadata, model)
        expect(metadata?.stopReason).toBe('stop')
        expect(parsed.valid).toBe(true)
        expect(output.trim()).not.toBe('')
        expect(toolCalls).toEqual([])
      }
    )
  }
)
