import type { CognitiveMetadata, CognitiveStreamChunk } from '@botpress/cognitive'
import assert from 'node:assert/strict'

import { Chat, type ChatMessage, type MessageDelta } from '../../src/chat/chat.js'
import { DefaultComponents } from '../../src/chat/component.default.js'
import type { Component } from '../../src/chat/component.js'
import type { Response } from '../../src/chat/response.js'
import {
  _CustomModelClient,
  type RuntimeGenerateContentInput,
  type RuntimeGenerateContentOutput,
} from '../../src/custom-client.js'
import { Signals } from '../../src/errors.js'
import { executeContext } from '../../src/runtime/execute.js'
import type { ExecutionProps } from '../../src/runtime/types.js'
import { Session, type SessionInput } from '../../src/session/session.js'

export type ReviewExecution = {
  type: 'execution'
  label: string
  requests: RuntimeGenerateContentInput[]
  responses: RuntimeGenerateContentOutput[]
  streaming: boolean
  outcome: {
    status: string
    exit?: string
    output?: unknown
    error?: { name: string; message: string }
    iterations: string[]
  }
  delivered: ChatMessage[]
  deltas: MessageDelta[]
}

export type ReviewStep = ReviewExecution | { type: 'note'; text: string; details?: unknown }

export type ReviewScenario = {
  name: string
  title: string
  description: string
  steps: ReviewStep[]
}

type ReviewSettings = Pick<ExecutionProps, 'instructions' | 'tools' | 'objects' | 'exits'> & {
  components?: Component[]
  response?: Response
  mode?: 'chat' | 'worker'
}

type CaptureOptions = Omit<ExecutionProps, 'client' | 'model' | 'chat' | 'session'> & {
  messages?: SessionInput[]
  streaming?: boolean
  expectedStatus?: 'success' | 'error'
}

const metadata: CognitiveMetadata = {
  provider: 'fixture',
  model: 'protocol-review',
  cached: false,
  latency: 0,
  cost: 0,
  usage: { inputTokens: 0, outputTokens: 0, inputCost: 0, outputCost: 0 },
}

export function textReply(output: string): RuntimeGenerateContentOutput {
  return { output, metadata }
}

let callNumber = 0

export function codeReply(code: string, output = ''): RuntimeGenerateContentOutput {
  return {
    output,
    toolCalls: [{ id: `review_call_${++callNumber}`, name: 'run_javascript', input: { code } }],
    metadata,
  }
}

/** Records the real request without invoking Cognitive or a model provider. */
class RecordingClient extends _CustomModelClient {
  public readonly requests: RuntimeGenerateContentInput[] = []
  public readonly responses: RuntimeGenerateContentOutput[] = []

  public constructor(private readonly _script: RuntimeGenerateContentOutput[]) {
    super()
  }

  public async getModelDetails(id: string) {
    return {
      id,
      name: id,
      description: 'Offline protocol-review fixture; no inference or media processing.',
      input: { maxTokens: 128_000, costPer1MTokens: 0 },
      output: { maxTokens: 8000, costPer1MTokens: 0 },
      tags: [],
      lifecycle: 'production' as const,
    }
  }

  public async generateText(input: RuntimeGenerateContentInput): Promise<RuntimeGenerateContentOutput> {
    this.requests.push(structuredClone(input))

    const reply = this._script[this.responses.length]
    assert.ok(reply, 'Unexpected model request: the scenario has no remaining scripted response.')
    this.responses.push(structuredClone(reply))

    return structuredClone(reply)
  }

  public assertComplete() {
    assert.equal(this.responses.length, this._script.length, 'The scenario did not consume every scripted response.')
  }
}

class StreamingRecordingClient extends RecordingClient {
  public async *generateTextStream(input: RuntimeGenerateContentInput): AsyncGenerator<CognitiveStreamChunk> {
    const reply = await this.generateText(input)

    for (let offset = 0; offset < reply.output.length; offset += 12) {
      yield { output: reply.output.slice(offset, offset + 12), created: Date.now() }
    }

    yield { toolCalls: reply.toolCalls, metadata: reply.metadata, finished: true, created: Date.now() }
  }
}

export class PromptReview {
  public session = new Session()
  public readonly scenario: ReviewScenario
  public readonly deltas: MessageDelta[] = []

  public constructor(
    details: Omit<ReviewScenario, 'steps'>,
    private readonly _settings: ReviewSettings = {}
  ) {
    this.scenario = { ...details, steps: [] }
  }

  public note(text: string, details?: unknown) {
    this.scenario.steps.push({ type: 'note', text, details })
  }

  public async run(label: string, replies: RuntimeGenerateContentOutput[], options: CaptureOptions = {}) {
    const { messages, streaming = false, expectedStatus = 'success', ...props } = options
    const { components = Object.values(DefaultComponents), response, mode = 'chat', ...settings } = this._settings
    const client = streaming ? new StreamingRecordingClient(replies) : new RecordingClient(replies)
    const delivered: ChatMessage[] = []
    const deltas: MessageDelta[] = []
    const chat =
      mode === 'chat'
        ? new Chat({
            components: components.map((component) =>
              component.withHandler((props) => {
                delivered.push({ type: 'component', name: component.definition.name, props: structuredClone(props) })
              })
            ),
            response: {
              ...(typeof response === 'string' ? { preset: response } : response),
              handler: (text) => {
                delivered.push({ type: 'text', text })
              },
              onDelta: (delta) => {
                const captured = structuredClone(delta)
                deltas.push(captured)
                this.deltas.push(captured)
              },
            },
          })
        : undefined

    if (messages) {
      this.session.append(messages)
    }

    const result = await executeContext({
      ...settings,
      ...props,
      session: this.session,
      client,
      chat,
      model: 'fixture:protocol-review',
      options: { loop: 6, ...props.options },
    })

    if (result.isError() && expectedStatus !== 'error') {
      throw new Error(`${this.scenario.name}: ${label} failed`, { cause: result.error })
    }

    assert.equal(result.status, expectedStatus, `${this.scenario.name}: ${label}`)
    client.assertComplete()

    for (const request of client.requests) {
      assertRequest(request, mode)
    }

    this.session = result.session
    const error = result.isError() ? Signals.maybeDeserializeError(result.error) : undefined

    this.scenario.steps.push({
      type: 'execution',
      label,
      requests: client.requests,
      responses: client.responses,
      streaming,
      outcome: {
        status: result.status,
        exit: result.isSuccess() ? result.result.exit.name : undefined,
        output: result.isSuccess() ? result.output : undefined,
        error: result.isError()
          ? {
              name: error instanceof Error ? error.name : 'Error',
              message: error instanceof Error ? error.message : String(error),
            }
          : undefined,
        iterations: result.iterations.map((iteration) => iteration.status.type),
      },
      delivered,
      deltas,
    })

    return result
  }
}

function assertRequest(request: RuntimeGenerateContentInput, mode: 'chat' | 'worker') {
  assert.deepEqual(
    request.tools?.map((tool) => tool.name),
    ['run_javascript']
  )
  assert.deepEqual(request.toolControl, { mode: mode === 'chat' ? 'auto' : 'required', parallel: false })

  const seen = new Set<string>()
  const pending = new Set<string>()

  for (const message of request.messages) {
    for (const call of message.toolCalls ?? []) {
      assert.equal(seen.has(call.id), false, `Duplicate native call: ${call.id}`)
      seen.add(call.id)
      pending.add(call.id)
    }

    if (message.type === 'tool_result') {
      assert.equal(message.role, 'user')
      assert.ok(message.toolResultCallId && pending.delete(message.toolResultCallId), 'Orphaned tool result')
    }
  }

  assert.equal(pending.size, 0, 'A request contains unresolved native calls.')

  const hasAudio = request.messages.some(
    (message) => Array.isArray(message.content) && message.content.some((part) => part.type === 'audio')
  )

  if (hasAudio) {
    assert.ok(request.options?.transcriptionModel)
  } else {
    assert.equal(request.options?.transcriptionModel, undefined)
  }
}
