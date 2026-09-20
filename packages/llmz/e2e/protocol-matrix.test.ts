import type { CognitiveMetadata, CognitiveRequest, CognitiveToolCall } from '@botpress/cognitive'
import { parse } from 'acorn'
import { appendFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { getNativeSystemMessage } from '../src/prompts/native.js'
import { RUN_JAVASCRIPT_TOOL, transcriptToNativeMessages } from '../src/runtime/native-tools.js'

import {
  cases,
  client,
  expectAllowedRestart,
  expectModelRoute,
  fallbackModels,
  models,
} from './__tests__/model-evaluation.js'
import {
  checkProtocolTask,
  checkResponseShape,
  evaluateNativeResponse,
  protocolMatrix,
} from './__tests__/protocol-matrix.js'

// 144 distinct tasks in BOTH delivery modes. No repair, retry or cache; fallback is opt-in.
describe.skipIf(!models.length).each(cases.length ? cases : [{ model: 'disabled', run: 1 }])(
  'protocol matrix: $model sample $run',
  ({ model, run }) => {
    it.each(
      protocolMatrix.flatMap((scenario) => [false, true].map((streaming) => ({ scenario, streaming, id: scenario.id })))
    )('$id streaming=$streaming', { retry: 0, timeout: 60000 }, async ({ scenario, streaming }) => {
      const system = await getNativeSystemMessage(scenario.props)
      const messages: CognitiveRequest['messages'] = [system.message, ...transcriptToNativeMessages(scenario.messages)]

      if (scenario.history) {
        messages.push(
          {
            role: 'assistant',
            type: 'tool_calls',
            content: null,
            toolCalls: [
              {
                id: 'read-account',
                type: 'function',
                function: { name: 'run_javascript', arguments: { code: 'return inspect(await readAccount())' } },
              },
            ],
          },
          {
            role: 'user',
            type: 'tool_result',
            toolResultCallId: 'read-account',
            content:
              scenario.history === 'result'
                ? 'run_javascript: succeeded\n\nTools called\n- readAccount(): succeeded\n\ninspect() result\n{ plan: "Orchid", projects: 17 }'
                : 'run_javascript: failed\nreadAccount failed: temporary service failure. Retry is safe. No variables or successful calls were preserved.\n\ninspect() result\nNot produced; execution did not complete an inspection.',
          }
        )
      }

      const chatEnabled = scenario.props.isChatEnabled

      const request: CognitiveRequest = {
        model,
        messages,
        temperature: 0.7,
        reasoningEffort: 'none',
        maxTokens: 1600,
        tools: [RUN_JAVASCRIPT_TOOL],
        toolControl: { mode: chatEnabled ? 'auto' : 'required', parallel: false },
        options: { skipCache: true },
      }

      let output = ''
      let metadata: CognitiveMetadata | undefined
      let restarts = 0
      let toolCalls: CognitiveToolCall[] = []

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
          restarts += chunk.restart ? 1 : 0
        }
      } else {
        const response = await client.generateText(request)
        output = response.output
        toolCalls = response.toolCalls ?? []
        metadata = response.metadata
      }

      const parsed = await evaluateNativeResponse(output, toolCalls, scenario.props)
      const record = {
        id: scenario.id,
        model,
        run,
        streaming,
        output,
        toolCalls,
        metadata,
        restarts,
        errors: parsed.errors,
        executionErrors: parsed.executionErrors,
        businessCalls: parsed.businessCalls,
        deliveredMessages: parsed.sends,
        exit: parsed.next,
        behavior: checkProtocolTask(scenario, parsed),
        shape: checkResponseShape(scenario, parsed),
      }

      console.info(JSON.stringify(record))

      if (process.env.LLMZ_EVAL_RECORDS) {
        appendFileSync(process.env.LLMZ_EVAL_RECORDS, JSON.stringify(record) + '\n')
      }

      expectModelRoute(metadata, model)

      if (!fallbackModels.length) {
        expect(restarts).toBe(0)
      }

      expect(['stop', 'tool_calls']).toContain(metadata?.stopReason)
      expect(parsed.errors).toEqual([])
      expect(parsed.executionErrors).toEqual([])

      if (parsed.code) {
        expect(() =>
          parse(parsed.code!, {
            ecmaVersion: 'latest',
            allowReturnOutsideFunction: true,
            allowAwaitOutsideFunction: true,
          })
        ).not.toThrow()
      }

      expect(record.shape, JSON.stringify(record)).toBe(true)
      expect(record.behavior, JSON.stringify(record)).toBe(true)
    })
  }
)
