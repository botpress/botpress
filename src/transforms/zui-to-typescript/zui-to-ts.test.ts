import { describe, expect, test } from 'vitest'
import { z } from '../../z'

describe('zui-to-ts', () => {
  test('generate typings for example schema', async () => {
    const schema = z.object({
      name: z.string().title('Name'),
      age: z.number().max(100).min(0).title('Age').describe('Age in years').default(18),
      job: z.enum(['developer', 'designer', 'manager']).title('Job').default('developer'),
      group: z.union([z.literal('avg'), z.literal('key'), z.literal('max')]),
    })

    const def = await schema.toTypescriptTypings({ schemaName: 'User' })
    expect(def).toMatchInlineSnapshot(`
"export interface User {
name: string
/**
 * Age in years
 */
age?: number
job?: (\"developer\" | \"designer\" | \"manager\")
group: (\"avg\" | \"key\" | \"max\")
}
"
    `)
  })

  test('without schema, no export statement', async () => {
    const schema = z.object({
      name: z.string().title('Name'),
    })

    const def = await schema.toTypescriptTypings()
    expect(def).toMatchInlineSnapshot(`
"{
name: string
}
"
    `)
  })
})
