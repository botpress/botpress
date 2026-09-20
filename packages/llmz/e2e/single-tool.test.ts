import type { CognitiveMetadata, CognitiveStreamChunk, CognitiveToolCall } from '@botpress/cognitive'
import { z } from '@bpinternal/zui'
import { appendFileSync } from 'node:fs'
import { assert, describe, expect, it } from 'vitest'

import type { ChatMessage } from '../src/chat/chat.js'
import {
  _CustomModelClient,
  type RuntimeGenerateContentInput,
  type RuntimeGenerateContentOptions,
} from '../src/custom-client.js'
import { DefaultComponents, Exit, ListenExit, Tool, execute, type ExecutionResult } from '../src/index.js'
import { Session } from '../src/session/session.js'

import { createTestChat } from './__tests__/chat.js'
import {
  cases,
  client,
  expectAcceptedProtocol,
  expectModelRoute,
  expectRuntimeModelRoute,
  metrics,
  models,
} from './__tests__/model-evaluation.js'

const enabled = models.length > 0 && Boolean(process.env.CLOUD_PAT && process.env.CLOUD_BOT_ID)
const testOptions = { retry: 0, timeout: 120_000 }
const executionOptions = { loop: 1, timeout: 45_000, maxTokens: 16_000 }

class RecordingClient extends _CustomModelClient {
  public requests: RuntimeGenerateContentInput[] = []
  public generations: CognitiveMetadata[] = []
  public calls: CognitiveToolCall[][] = []
  public outputs: string[] = []
  public restarts: CognitiveStreamChunk['restart'][] = []

  public getModelDetails(model: string) {
    return client.getModelDetails(model)
  }

  protected request(input: RuntimeGenerateContentInput): RuntimeGenerateContentInput {
    this.requests.push(input)

    return { ...input, maxTokens: 4096 }
  }

  public async generateText(input: RuntimeGenerateContentInput, options?: RuntimeGenerateContentOptions) {
    const result = await client.generateText(this.request(input), options)
    this.generations.push(result.metadata)
    this.calls.push(result.toolCalls ?? [])
    this.outputs.push(result.output)

    return result
  }
}

class StreamingClient extends RecordingClient {
  public async *generateTextStream(
    input: RuntimeGenerateContentInput,
    options?: RuntimeGenerateContentOptions
  ): AsyncGenerator<CognitiveStreamChunk> {
    let output = ''
    let calls: CognitiveToolCall[] = []
    let metadata: CognitiveMetadata | undefined

    for await (const chunk of client.generateTextStream(this.request(input), options)) {
      if (chunk.restart) {
        this.restarts.push(chunk.restart)
        output = ''
        calls = []
        metadata = undefined
      }

      output += chunk.output ?? ''

      if (chunk.toolCalls) {
        calls = chunk.toolCalls
      }

      if (chunk.metadata) {
        metadata = chunk.metadata
      }

      yield chunk
    }

    if (metadata) {
      this.generations.push(metadata)
    }

    this.calls.push(calls)
    this.outputs.push(output)
  }
}

function inspectRun(
  scenario: string,
  model: string,
  run: number,
  recording: RecordingClient,
  result: ExecutionResult,
  details: Record<string, unknown>
): void {
  const record = {
    scenario: `single-tool/${scenario}`,
    model,
    run,
    ...metrics(result),
    generations: recording.generations.map((generation) => ({
      model: generation.model,
      cached: generation.cached,
      stopReason: generation.stopReason,
      outputTokens: generation.usage.outputTokens,
      fallbackPath: generation.fallbackPath ?? [],
      requestId: generation.requestId ?? null,
    })),
    calls: recording.calls,
    outputs: recording.outputs,
    restarts: recording.restarts,
    ...details,
  }
  console.info(JSON.stringify(record))

  if (process.env.LLMZ_EVAL_RECORDS) {
    appendFileSync(process.env.LLMZ_EVAL_RECORDS, JSON.stringify(record) + '\n')
  }

  expectAcceptedProtocol(result)
  expectRuntimeModelRoute(result, model)
  expect(recording.generations).toHaveLength(recording.requests.length)
  expect(recording.restarts).toEqual([])

  for (const generation of recording.generations) {
    expectModelRoute(generation, model)
  }

  for (const request of recording.requests) {
    expect(request.tools?.map((tool) => tool.name)).toEqual(['run_javascript'])
    expect(request.toolControl).toMatchObject({ parallel: false })
  }

  for (const calls of recording.calls) {
    expect(calls.length).toBeLessThanOrEqual(1)
    expect(calls.every((call) => call.name === 'run_javascript')).toBe(true)
  }
}

// A small live acceptance sample. Business functions touch only local fixtures.
// Keep one fresh sample per condition and no automatic test retries.
describe.skipIf(!enabled).each(cases.length ? cases : [{ model: 'disabled', run: 1 }])(
  'single native tool: $model, sample $run',
  ({ model, run }) => {
    it.each([false, true])(
      'completes through a typed exit in one generation (streaming=%s)',
      testOptions,
      async (streaming) => {
        const recording = streaming ? new StreamingClient() : new RecordingClient()
        let reads = 0
        const readLimit = new Tool({
          name: 'readLimit',
          description: 'Read the current local project limit.',
          output: z.number(),
          handler: async () => {
            reads++

            return 17
          },
        })
        const done = new Exit({
          name: 'done',
          description: 'Complete with the verified project limit.',
          schema: z.object({ limit: z.number() }),
        })
        const session = new Session()
        session.append([{ role: 'user', content: 'Read the project limit and complete the task.' }])

        const result = await execute({
          session,
          client: recording,
          model,
          temperature: 0,
          reasoningEffort: 'none',
          tools: [readLimit],
          exits: [done],
          instructions:
            'Call readLimit exactly once and finish in the same JavaScript program with return exit("done", { limit }). Do not inspect first or add assistant text.',
          options: executionOptions,
        })

        inspectRun('typed-exit', model, run, recording, result, { reads, streaming })
        assert(result.is(done))
        expect(result.output).toEqual({ limit: 17 })
        expect(reads).toBe(1)
        expect(recording.requests).toHaveLength(1)
        expect(recording.calls[0]).toHaveLength(1)
        expect(recording.outputs).toEqual([''])

        const code = recording.calls[0]?.[0]?.input.code

        expect(code).toMatch(/\bexit\s*\(/)
      }
    )

    it('streams assistant text and sends two buttons in one generation', testOptions, async () => {
      const recording = new StreamingClient()
      const delivered: ChatMessage[] = []
      const deltas: string[] = []
      const session = new Session()
      session.append([{ role: 'user', content: 'Ask me to choose Standard or Premium, with a button for each.' }])

      const result = await execute({
        session,
        client: recording,
        model,
        temperature: 0,
        reasoningEffort: 'none',
        instructions:
          'Say exactly "Which plan would you like?" as normal assistant text, then call run_javascript once. In the code, call chat.buttons([{ action: "say", label: "Standard" }, { action: "say", label: "Premium" }]); then finish with return exit("listen"). Component methods are synchronous. Do not use inspect.',
        chat: createTestChat({
          components: [DefaultComponents.Buttons],
          onMessage: async (component) => {
            delivered.push(component)
          },
          onDelta: async (delta) => {
            if (delta.restart) {
              deltas.length = 0
            } else {
              deltas.push(delta.delta)
            }
          },
        }),
        options: executionOptions,
      })

      inspectRun('streamed-buttons', model, run, recording, result, { delivered, deltas })
      expect(result.is(ListenExit)).toBe(true)
      expect(recording.requests).toHaveLength(1)
      expect(recording.calls[0]).toHaveLength(1)
      expect(recording.outputs).toEqual(['Which plan would you like?'])
      expect(deltas.join('')).toBe('Which plan would you like?')
      const text = delivered.filter((message) => message.type === 'text')
      const buttons = delivered.filter((message) => message.type === 'component')

      expect(delivered).toHaveLength(2)
      expect(text).toHaveLength(1)
      expect(text[0]?.text).toBe('Which plan would you like?')
      expect(buttons).toEqual([DefaultComponents.Buttons.render([{ label: 'Standard' }, { label: 'Premium' }])])
    })

    it('inspects once and answers from the result in the next generation', testOptions, async () => {
      const recording = new RecordingClient()
      const delivered: string[] = []
      let reads = 0
      const readAccount = new Tool({
        name: 'readAccount',
        output: z.object({ plan: z.string(), projects: z.number() }),
        handler: async () => {
          reads++

          return { plan: 'Orchid', projects: 17 }
        },
      })
      const session = new Session()
      session.append([{ role: 'user', content: 'What is my account plan and project count?' }])

      const result = await execute({
        session,
        client: recording,
        model,
        temperature: 0,
        reasoningEffort: 'none',
        tools: [readAccount],

        instructions:
          'First call run_javascript with return inspect(await readAccount()). Do not send a progress update. After observing the result, answer with the plan and project count as normal assistant text, with no further tool calls.',
        chat: createTestChat({
          components: [],
          onMessage: async (component) => {
            expect(component.type).toBe('text')
            if (component.type === 'text') {
              delivered.push(component.text)
            }
          },
        }),
        options: { ...executionOptions, loop: 2 },
      })

      inspectRun('inspect-answer', model, run, recording, result, { reads, delivered })
      expect(result.is(ListenExit)).toBe(true)
      expect(reads).toBe(1)
      expect(recording.requests).toHaveLength(2)
      expect(recording.calls.map((calls) => calls.length)).toEqual([1, 0])
      expect(result.iterations.map((iteration) => iteration.status.type)).toEqual([
        'thinking_requested',
        'exit_success',
      ])
      expect(result.session.getBindings().$return).toEqual({ plan: 'Orchid', projects: 17 })
      expect(delivered).toHaveLength(1)
      expect(delivered[0]).toMatch(/Orchid/)
      expect(delivered[0]).toMatch(/\b17\b/)
    })
  }
)
