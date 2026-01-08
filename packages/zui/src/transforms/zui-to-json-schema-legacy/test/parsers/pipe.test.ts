import { describe, it, expect } from 'vitest'
import { zuiKey } from '../../../../ui/constants'
import { z } from '../../../../z/index'
import { parsePipelineDef } from '../../parsers/pipeline'
import { getRefs } from '../../Refs'

describe('pipe', () => {
  it('Should create an allOf schema with all its inner schemas represented', () => {
    const schema = z.number().pipe(z.number().int())

    expect(parsePipelineDef(schema._def, getRefs())).toEqual({
      allOf: [
        { type: 'number', [zuiKey]: {} },
        { type: 'integer', [zuiKey]: {} },
      ],
    })
  })

  it('Should parse the input schema if that strategy is selected', () => {
    const schema = z.number().pipe(z.number().int())

    expect(parsePipelineDef(schema._def, getRefs({ pipeStrategy: 'input' }))).toEqual({
      type: 'number',
      [zuiKey]: {},
    })
  })

  it('Should parse the output schema (last schema in pipe) if that strategy is selected', () => {
    const schema = z.string().pipe(z.date()).pipe(z.number().int())

    expect(parsePipelineDef(schema._def, getRefs({ pipeStrategy: 'output' }))).toEqual({
      type: 'integer',
      [zuiKey]: {},
    })
  })
})
