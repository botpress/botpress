import type { CognitiveMetadata, CognitiveResponse, CognitiveStreamChunk, CognitiveToolCall } from '@botpress/cognitive'
import { _CustomModelClient, type RuntimeGenerateContentInput } from '../../custom-client.js'

export const nativeMetadata: CognitiveMetadata = {
  provider: 'fake',
  model: 'fake',
  cached: false,
  latency: 1,
  cost: 0,
  usage: { inputTokens: 10, outputTokens: 10, inputCost: 0, outputCost: 0 },
}
let callNumber = 0
export const nativeCall = (
  name: string,
  input: Record<string, unknown> = {},
  id = `call_${++callNumber}`
): CognitiveToolCall => ({ id, name, input })
export const javascript = (code: string): CognitiveResponse => response('', [nativeCall('run_javascript', { code })])
export const response = (output = '', toolCalls?: CognitiveToolCall[]): CognitiveResponse => ({
  output,
  toolCalls,
  metadata: nativeMetadata,
})
export class NativeClient extends _CustomModelClient {
  public requests: RuntimeGenerateContentInput[] = []
  public constructor(public responses: CognitiveResponse[]) {
    super()
  }
  public async getModelDetails(id: string) {
    return {
      id,
      name: id,
      description: '',
      input: { maxTokens: 128_000, costPer1MTokens: 0 },
      output: { maxTokens: 8000, costPer1MTokens: 0 },
      tags: [],
      lifecycle: 'production' as const,
    }
  }
  public async generateText(input: RuntimeGenerateContentInput) {
    this.requests.push(structuredClone(input))
    const next = this.responses.shift()
    if (!next) {
      throw new Error('No more scripted native responses')
    }

    return next
  }
}
export class NativeStreamClient extends NativeClient {
  public constructor(
    responses: CognitiveResponse[],
    public size = 7,
    public probe: () => void = () => {}
  ) {
    super(responses)
  }
  public async *generateTextStream(input: RuntimeGenerateContentInput): AsyncGenerator<CognitiveStreamChunk> {
    const result = await this.generateText(input)
    for (let i = 0; i < result.output.length; i += this.size) {
      yield { output: result.output.slice(i, i + this.size), created: Date.now() }
      this.probe()
    }

    yield { toolCalls: result.toolCalls, metadata: result.metadata, finished: true, created: Date.now() }
    this.probe()
  }
}
