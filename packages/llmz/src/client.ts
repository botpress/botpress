import type { AxiosInstance } from 'axios'
import { backOff } from 'exponential-backoff'
import { Client } from '@botpress/client'

import { llm } from './sdk-interfaces/llm/generateContent.js'

type Props = {
  userId?: string
  integration: string
  signal?: AbortSignal
}

type GenerationMetadata = {
  cached: boolean
  model: string
  cost: {
    input: number
    output: number
  }
  latency: number
  tokens: {
    input: number
    output: number
  }
}

export type IClonable<T> = T & {
  clone(): IClonable<T>
}

type ActionMeta = { cached: boolean }

const cloneClient = (client: Client | IClonable<Client>) => {
  if ('clone' in client && typeof client.clone === 'function') {
    return client.clone()
  }

  return new Client(client.config)
}

const abortable = (client: Client, signal: AbortSignal) => {
  const clone = cloneClient(client)
  const instance = (clone as any).axiosInstance as AxiosInstance
  instance.defaults.signal = signal
  return clone
}

export interface CognitiveClient {
  (
    props: Partial<llm.generateContent.Input> & Props
  ): Promise<llm.generateContent.Output & { metadata: GenerationMetadata }>
}

export const createClient =
  (client: Client): CognitiveClient =>
  async (props) => {
    const clone = props.signal ? abortable(client, props.signal) : cloneClient(client)
    const start = Date.now()
    const input: llm.generateContent.Input = {
      messages: [],
      temperature: 0.0,
      topP: 1,
      model: props.model,
      userId: props.userId,
      ...props
    }

    const { output, meta } = (await backOff(
      () => clone.callAction({ type: `${props.integration}:generateContent`, input }),
      {
        numOfAttempts: 3,
        retry: (_err, _attempt) => {
          if (props.signal?.aborted) {
            // We don't want to retry if the request was aborted
            return false
          }
          // TODO: Check if error is UpstreamProvider error (ie. model degraded)
          // If so, retry but with the configured fallback model
          return true
        }
      }
    )) as unknown as { output: llm.generateContent.Output; meta: ActionMeta }

    const latency = Date.now() - start

    return {
      ...output,
      metadata: {
        cached: meta.cached ?? false,
        model: props.model?.id || 'unknown',
        latency,
        cost: { input: output.usage.inputCost, output: output.usage.outputCost },
        tokens: { input: output.usage.inputTokens, output: output.usage.outputTokens }
      }
    }
  }
