import { describe, it, expect } from 'vitest'
import { toTypescript } from '.'
import z from '../../z'

describe('functions', () => {
  it('string literals', async () => {
    const typings = toTypescript(z.literal('Hello, world!'))
    expect(typings).toMatchWithoutFormatting(`'Hello, world!'`)
  })

  it('number literals', async () => {
    const code = toTypescript(z.literal(1))
    expect(code).toMatchWithoutFormatting('1')
  })

  it('boolean literals', async () => {
    const code = toTypescript(z.literal(true))
    expect(code).toMatchWithoutFormatting('true')
  })

  it('undefined literals', async () => {
    const typings = toTypescript(z.literal(undefined))
    expect(typings).toMatchWithoutFormatting('undefined')
  })

  it('null literals', async () => {
    const typings = toTypescript(z.literal(null))
    expect(typings).toMatchWithoutFormatting('null')
  })

  it('bigint literals', async () => {
    const n = BigInt(100)
    const fn = () => toTypescript(z.literal(n))
    expect(fn).toThrowError()
  })

  it('non explicitly discriminated union', async () => {
    const schema = z.union([
      z.object({ enabled: z.literal(true), foo: z.string() }),
      z.object({ enabled: z.literal(false), bar: z.number() }),
    ])
    const typings = toTypescript(schema)
    expect(typings).toMatchWithoutFormatting(`{
        enabled: true;
        foo: string
      } | {
        enabled: false;
        bar: number
      }
    `)
  })
})
