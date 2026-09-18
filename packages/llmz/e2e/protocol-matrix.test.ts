import { appendFileSync } from 'node:fs'
import { parse } from 'acorn'
import type { CognitiveMetadata, CognitiveRequest } from '@botpress/cognitive'
import { describe, expect, it } from 'vitest'
import { DualModePrompt } from '../src/prompts/dual-modes.js'
import { parseAssistantResponse } from '../src/prompts/common.js'
import {
  cases,
  client,
  expectAllowedRestart,
  expectModelRoute,
  fallbackModels,
  models,
} from './__tests__/model-evaluation.js'
import { checkProtocolTask, checkResponseShape, protocolMatrix } from './__tests__/protocol-matrix.js'

// 144 distinct tasks in BOTH delivery modes. No repair, retry or cache; fallback is opt-in.
describe.skipIf(!models.length).each(cases.length ? cases : [{ model: 'disabled', run: 1 }])(
  'protocol matrix: $model sample $run',
  ({ model, run }) => {
    it.each(
      protocolMatrix.flatMap((scenario) => [false, true].map((streaming) => ({ scenario, streaming, id: scenario.id })))
    )('$id streaming=$streaming', { retry: 0, timeout: 60000 }, async ({ scenario, streaming }) => {
      const system = await DualModePrompt.getSystemMessage(scenario.props)
      const initial = await DualModePrompt.getInitialUserMessage(scenario.props)
      const messages: CognitiveRequest['messages'] = [system.message]
      let user = initial
      if (scenario.history) {
        messages.push(initial, { role: 'assistant', content: '■start\n■run\nreturn await readAccount()\n■end' })
        user =
          scenario.history === 'result'
            ? await DualModePrompt.getThinkingMessage({
                isChatEnabled: true,
                variables: { plan: 'Orchid', projects: 17 },
              })
            : await DualModePrompt.getCodeExecutionErrorMessage({
                isChatEnabled: true,
                message: 'readAccount failed: temporary service failure. Retry is safe.',
                stacktrace: 'at readAccount',
                variables: {},
                toolCalls: [{ tool: 'readAccount', input: {}, error: 'temporary failure' }],
              })
      }
      messages.push({ ...user, content: String(user.content) + DualModePrompt.getExecutionState!(scenario.props) })
      const request: CognitiveRequest = {
        model,
        messages,
        temperature: 0.7,
        reasoningEffort: 'none',
        maxTokens: 1600,
        stopSequences: DualModePrompt.getStopTokens(),
        options: { skipCache: true },
      }
      let output = '',
        metadata: CognitiveMetadata | undefined,
        restarts = 0
      if (streaming) {
        for await (const chunk of client.generateTextStream(request)) {
          if (chunk.restart) {
            expectAllowedRestart(chunk.restart)
            output = ''
            metadata = undefined
          }
          output += chunk.output ?? ''
          metadata = chunk.metadata ?? metadata
          restarts += chunk.restart ? 1 : 0
        }
      } else {
        const response = await client.generateText(request)
        output = response.output
        metadata = response.metadata
      }
      const parsed = parseAssistantResponse(output, metadata?.stopReason)
      const record = {
        id: scenario.id,
        model,
        run,
        streaming,
        output,
        metadata,
        restarts,
        diagnostics: parsed.diagnostics,
        behavior: checkProtocolTask(scenario, parsed),
        shape: checkResponseShape(scenario, parsed),
      }
      console.info(JSON.stringify(record))
      if (process.env.LLMZ_EVAL_RECORDS) appendFileSync(process.env.LLMZ_EVAL_RECORDS, JSON.stringify(record) + '\n')
      expectModelRoute(metadata, model)
      if (!fallbackModels.length) expect(restarts).toBe(0)
      expect(metadata?.stopReason).not.toBe('max_tokens')
      expect(output).toMatch(/^■start\r?\n/m)
      expect(parsed.diagnostics?.filter((d) => d.code !== 'unexpected-text' && d.code !== 'example-delimiter')).toEqual(
        []
      )
      if (parsed.code)
        expect(() =>
          parse(parsed.code!, {
            ecmaVersion: 'latest',
            allowReturnOutsideFunction: true,
            allowAwaitOutsideFunction: true,
          })
        ).not.toThrow()
      expect(checkResponseShape(scenario, parsed), output).toBe(true)
    })
  }
)
