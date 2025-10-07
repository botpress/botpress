import { describe, it, expect } from 'vitest'
import { parseLLMOutput } from './parse-content'
import * as sdk from '@botpress/sdk'
import { z } from '@botpress/sdk'
import * as cognitive from '@botpress/cognitive'

const COGNITIVE_OUTPUT = (content: string): cognitive.GenerateContentOutput => ({
  provider: 'test-provider',
  model: 'test-model',
  botpress: { cost: 0 },
  id: '',
  usage: {
    inputCost: 0,
    inputTokens: 0,
    outputTokens: 0,
    outputCost: 0,
  },
  choices: [{ content, index: 0, role: 'assistant', stopReason: 'other' }],
})

const CONTENT_PARSE_SCHEMA = z.object({ foo: z.string(), bar: z.number() })

describe('parseLLMOutput', () => {
  it('valid json parsing is successful', () => {
    const output = COGNITIVE_OUTPUT(`{"foo": "hello", "bar": 42}`)

    const result = parseLLMOutput<z.infer<typeof CONTENT_PARSE_SCHEMA>>({ schema: CONTENT_PARSE_SCHEMA, ...output })

    expect(result.success).toBe(true)
  })

  it('invalid json parsing throws an error', () => {
    const output = COGNITIVE_OUTPUT(`not a json`)

    expect(() => {
      parseLLMOutput<typeof CONTENT_PARSE_SCHEMA>({ schema: CONTENT_PARSE_SCHEMA, ...output })
    }).toThrowError(sdk.ZodError)
  })

  it('empty choices parsing throws an error', () => {
    expect(() => parseLLMOutput<any>({ choices: [] } as any)).toThrow(sdk.RuntimeError)
  })

  it('valid json with whitespaces parsing is successful', () => {
    const output = COGNITIVE_OUTPUT(`  { "foo": "bar", "bar": 123 }  `)

    const result = parseLLMOutput<z.infer<typeof CONTENT_PARSE_SCHEMA>>({ schema: CONTENT_PARSE_SCHEMA, ...output })

    expect(result.success).toBe(true)
  })
})
