import { describe, it, expect } from 'vitest'
import { parseDiscriminator } from './parseDiscriminator'

describe('parseDiscriminator', () => {
  it('should create a discriminated union from two or more schemas', () => {
    const male = `z.object({ "gender": z.literal("male"), "strenght": z.number() })`
    const female = `z.object({ "gender": z.literal("female"), "wisdom": z.number() })`

    expect(
      parseDiscriminator(
        {
          oneOf: [
            {
              type: 'object',
              properties: {
                gender: {
                  type: 'string',
                  const: 'male',
                },
                strenght: {
                  type: 'number',
                },
              },
              required: ['gender', 'strenght'],
            },
            {
              type: 'object',
              properties: {
                gender: {
                  type: 'string',
                  const: 'female',
                },
                wisdom: {
                  type: 'number',
                },
              },
              required: ['gender', 'wisdom'],
            },
          ],
          discriminator: {
            propertyName: 'gender',
          },
        },
        { module: 'none', path: [], seen: new Map() },
      ),
    ).toStrictEqual(`z.discriminatedUnion("gender", [${male}, ${female}])`)
  })

  it('should extract a single schema', () => {
    expect(
      parseDiscriminator({ oneOf: [{ type: 'string' }] }, { module: 'none', path: [], seen: new Map() }),
    ).toStrictEqual('z.string()')
  })

  it('should return z.any() if array is empty', () => {
    expect(parseDiscriminator({ oneOf: [] }, { module: 'none', path: [], seen: new Map() })).toStrictEqual('z.any()')
  })
})
