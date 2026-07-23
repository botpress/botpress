import { describe, it, expect } from 'vitest'
import { parseLLMOutput } from './parse-content'
import * as sdk from '@botpress/sdk'
import { z } from '@botpress/sdk'
import * as cognitive from '@botpress/cognitive'

const COGNITIVE_OUTPUT = (content: string): Pick<cognitive.CognitiveResponse, 'output'> => ({
  output: content,
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

    let thrown: unknown | undefined = undefined
    try {
      parseLLMOutput<typeof CONTENT_PARSE_SCHEMA>({ schema: CONTENT_PARSE_SCHEMA, ...output })
    } catch (e) {
      thrown = e
    }

    expect(thrown).toBeDefined()
    expect(z.is.zuiError(thrown)).toBe(true)
  })

  it('empty choices parsing throws an error', () => {
    expect(() => parseLLMOutput<any>({ output: '' } as any)).toThrow(sdk.RuntimeError)
  })

  it('valid json with whitespaces parsing is successful', () => {
    const output = COGNITIVE_OUTPUT(`  { "foo": "bar", "bar": 123 }  `)

    const result = parseLLMOutput<z.infer<typeof CONTENT_PARSE_SCHEMA>>({ schema: CONTENT_PARSE_SCHEMA, ...output })

    expect(result.success).toBe(true)
  })
})
