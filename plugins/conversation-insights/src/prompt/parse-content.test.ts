import { describe, it, expect } from 'vitest'
import { parseLLMOutput, LLMOutput } from './parse-content'
import * as sdk from '@botpress/sdk'
import { z } from '@botpress/sdk'

const mockLLMOutput = (content: string): LLMOutput => ({
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

const EXAMPLE_SCHEMA = z.object({ foo: z.string(), bar: z.number() })

describe('parseLLMOutput', () => {
  it('parses valid JSON output', () => {
    const output = mockLLMOutput(`{"foo": "hello", "bar": 42}`)

    const result = parseLLMOutput<z.infer<typeof EXAMPLE_SCHEMA>>({ schema: EXAMPLE_SCHEMA, ...output })

    expect(result.success).toBe(true)
  })

  it('throws error if parsing fails', () => {
    const output = mockLLMOutput(`not a json`)

    expect(() => {
      parseLLMOutput<typeof EXAMPLE_SCHEMA>({ schema: EXAMPLE_SCHEMA, ...output })
    }).toThrowError(sdk.ZodError)
  })

  it('throws if choices is empty', () => {
    expect(() => parseLLMOutput<any>({ choices: [] } as any)).toThrow(sdk.RuntimeError)
  })

  it('parses output with extra whitespace', () => {
    const output = mockLLMOutput(`  { "foo": "bar", "bar": 123 }  `)

    const result = parseLLMOutput<z.infer<typeof EXAMPLE_SCHEMA>>({ schema: EXAMPLE_SCHEMA, ...output })

    expect(result.success).toBe(true)
  })
})
