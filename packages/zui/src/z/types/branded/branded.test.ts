import { test } from 'vitest'
import * as z from '../../index'
import * as utils from '../../utils'
import { BRAND } from '../../typings'

test('branded types', () => {
  const mySchema = z
    .object({
      name: z.string(),
    })
    .brand<'superschema'>()

  // simple branding
  type MySchema = z.infer<typeof mySchema>
  utils.assert.assertEqual<MySchema, { name: string } & { [BRAND]: { superschema: true } }>(true)

  const doStuff = (arg: MySchema) => arg
  doStuff(mySchema.parse({ name: 'hello there' }))

  // inheritance
  const extendedSchema = mySchema.brand<'subschema'>()
  type ExtendedSchema = z.infer<typeof extendedSchema>
  utils.assert.assertEqual<ExtendedSchema, { name: string } & BRAND<'superschema'> & BRAND<'subschema'>>(true)

  doStuff(extendedSchema.parse({ name: 'hello again' }))

  // number branding
  const numberSchema = z.number().brand<42>()
  type NumberSchema = z.infer<typeof numberSchema>
  utils.assert.assertEqual<NumberSchema, number & { [BRAND]: { 42: true } }>(true)

  // symbol branding
  const MyBrand: unique symbol = Symbol('hello')
  type MyBrand = typeof MyBrand
  const symbolBrand = z.number().brand<'sup'>().brand<typeof MyBrand>()
  type SymbolBrand = z.infer<typeof symbolBrand>
  // number & { [BRAND]: { sup: true, [MyBrand]: true } }
  utils.assert.assertEqual<SymbolBrand, number & BRAND<'sup'> & BRAND<MyBrand>>(true)

  // keeping brands out of input types
  const age = z.number().brand<'age'>()

  type Age = z.infer<typeof age>
  type AgeInput = z.input<typeof age>

  utils.assert.assertEqual<AgeInput, Age>(false)
  utils.assert.assertEqual<number, AgeInput>(true)
  utils.assert.assertEqual<number & BRAND<'age'>, Age>(true)

  // @ts-expect-error
  doStuff({ name: 'hello there!' })
})
