import { describe, it, expect } from 'vitest'
import { parseLLMOutput } from './parse-content'
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

  it.for([
    { case: 'plain text', output: 'not a json' },
    { case: 'a response cut off after its first character', output: '{' },
    { case: 'an object without the expected keys', output: '{"answer": "ok"}' },
    { case: 'text that cannot be repaired into JSON', output: '```json' },
    { case: 'an empty response', output: '' },
  ])('reports $case as unusable instead of throwing', ({ output }) => {
    // Arrange
    const response = COGNITIVE_OUTPUT(output)

    // Act
    const result = parseLLMOutput<z.infer<typeof CONTENT_PARSE_SCHEMA>>({ schema: CONTENT_PARSE_SCHEMA, ...response })

    // Assert
    expect(result.success).toBe(false)
  })

  it('valid json with whitespaces parsing is successful', () => {
    const output = COGNITIVE_OUTPUT(`  { "foo": "bar", "bar": 123 }  `)

    const result = parseLLMOutput<z.infer<typeof CONTENT_PARSE_SCHEMA>>({ schema: CONTENT_PARSE_SCHEMA, ...output })

    expect(result.success).toBe(true)
  })
})
