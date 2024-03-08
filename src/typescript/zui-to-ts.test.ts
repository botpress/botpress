import { describe, expect, test } from 'vitest'
import { zui } from '../zui'

describe('zui-to-ts', () => {
  test('validate simple schema', async () => {
    const schema = zui.object({
      name: zui.string().title('Name'),
      age: zui.number().max(100).min(0).title('Age').describe('Age in years').default(18),
      job: zui.enum(['developer', 'designer', 'manager']).title('Job').default('developer'),
      group: zui.union([zui.literal('avg'), zui.literal('key'), zui.literal('max')]),
    })

    const def = await schema.toTypescriptTypings({ schemaName: 'User' })
    expect(def).toMatchInlineSnapshot(`
      "export interface User {
        name: string;
        /**
         * Age in years
         */
        age?: number;
        job?: \"developer\" | \"designer\" | \"manager\";
        group: \"avg\" | \"key\" | \"max\";
      }
      "
    `)
  })

  test('without schema, no export statement', async () => {
    const schema = zui.object({
      name: zui.string().title('Name'),
    })

    const def = await schema.toTypescriptTypings()
    expect(def).toMatchInlineSnapshot(`
      "{
        name: string;
      }
      "
    `)
  })
})
