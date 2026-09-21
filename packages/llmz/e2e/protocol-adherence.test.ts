import type { CognitiveRequest, CognitiveMetadata } from '@botpress/cognitive'
import { describe, expect, it } from 'vitest'
import { parseAssistantResponse } from '../src/prompts/common.js'
import { DualModePrompt } from '../src/prompts/dual-modes.js'
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
        const props = protocolScenario(question)
        const system = await DualModePrompt.getSystemMessage(props)
        const user = await DualModePrompt.getInitialUserMessage(props)
        const request: CognitiveRequest = {
          model,
          temperature: 0.7,
          reasoningEffort: 'none',
          maxTokens: 1200,
          stopSequences: DualModePrompt.getStopTokens(),
          options: { skipCache: true },
          messages: [
            system.message,
            { ...user, content: String(user.content) + DualModePrompt.getExecutionState!(props) },
          ],
        }
        let output = ''
        let metadata: CognitiveMetadata | undefined
        if (streaming) {
          for await (const chunk of client.generateTextStream(request)) {
            if (chunk.restart) {
              expectAllowedRestart(chunk.restart)
              output = ''
              metadata = undefined
            }
            output += chunk.output ?? ''
            metadata = chunk.metadata ?? metadata
          }
        } else {
          const response = await client.generateText(request)
          output = response.output
          metadata = response.metadata
        }
        const parsed = parseAssistantResponse(output, metadata?.stopReason)
        console.info(
          JSON.stringify({ model, run, question, streaming, output, metadata, diagnostics: parsed.diagnostics })
        )
        expectModelRoute(metadata, model)
        expect(output).toMatch(/^■start\r?\n/m)
        expect(
          parsed.diagnostics?.filter((d) => d.code !== 'unexpected-text' && d.code !== 'example-delimiter')
        ).toEqual([])
        expect(parsed.sends.length).toBeGreaterThan(0)
        expect(parsed.sends.every((send) => send.name === 'message' && send.body?.trim())).toBe(true)
        expect(parsed.code).toBeUndefined()
        expect(parsed.next?.name).toBe('listen')
      }
    )
  }
)
