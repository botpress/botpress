import { describe, test } from 'vitest'
import { extract } from '../src/assertions/extract'
import { z } from '@bpinternal/zui'

describe('extract', { timeout: 30_000 }, () => {
  const person = z.object({
    name: z.string(),
    age: z.number().optional(),
    country: z.string().optional(),
  })

  test('strings (split names)', () => {
    extract('My name is Sylvain!', person).toBe({ name: 'Sylvain' })
    extract('My name is Sylvain, I am 33 yo and live in Canada', person).toMatchObject({ country: 'Canada' })
    extract('My name is Sylvain, I am 33 yo and live in Canada', person).toMatchObject({
      name: 'Sylvain',
      age: 33,
      country: 'Canada',
    })
  })

  test('toMatchInlineSnapshot', () => {
    extract('My name is Eric!', z.object({ name: z.string() })).toMatchInlineSnapshot(`
      {
        "name": "Eric",
      }
    `)
  })
})
