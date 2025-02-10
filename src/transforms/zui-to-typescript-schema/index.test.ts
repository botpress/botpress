import { describe, expect, test } from 'vitest'
import { toTypescriptSchema as toTypescript } from '.'
import { evalZuiString } from '../common/eval-zui-string'
import * as errors from '../common/errors'
import z, { ZodLiteral, ZodSchema, ZodType } from '../../z'
import { UIComponentDefinitions } from '../../ui'

const evalZui = (source: string): ZodSchema => {
  const evalResult = evalZuiString(source)
  if (!evalResult.sucess) {
    throw new Error(`${evalResult.error}: ${source}`)
  }
  return evalResult.value
}

const assert = (source: ZodType) => ({
  toGenerateItself() {
    const actual = toTypescript(source)
    const destination = evalZui(actual)
    expect(source.isEqual(destination)).toBe(true)
  },
  toThrowErrorWhenGenerating() {
    const fn = () => toTypescript(source)
    expect(fn).toThrowError(errors.ZuiToTypescriptSchemaError)
  },
})

describe.concurrent('toTypescriptZuiString', () => {
  test('string', () => {
    const schema = z.string()
    assert(schema).toGenerateItself()
  })
  test('number', () => {
    const schema = z.number()
    assert(schema).toGenerateItself()
  })
  test('nan', () => {
    const schema = z.nan()
    assert(schema).toGenerateItself()
  })
  test('bigint', () => {
    const schema = z.bigint()
    assert(schema).toGenerateItself()
  })
  test('boolean', () => {
    const schema = z.boolean()
    assert(schema).toGenerateItself()
  })
  test('date', () => {
    const schema = z.date()
    assert(schema).toGenerateItself()
  })
  test('undefined', () => {
    const schema = z.undefined()
    assert(schema).toGenerateItself()
  })
  test('null', () => {
    const schema = z.null()
    assert(schema).toGenerateItself()
  })
  test('any', () => {
    const schema = z.any()
    assert(schema).toGenerateItself()
  })
  test('unknown', () => {
    const schema = z.unknown()
    assert(schema).toGenerateItself()
  })
  test('never', () => {
    const schema = z.never()
    assert(schema).toGenerateItself()
  })
  test('void', () => {
    const schema = z.void()
    assert(schema).toGenerateItself()
  })
  test('array', () => {
    const schema = z.array(z.string())
    assert(schema).toGenerateItself()
  })
  test('object', () => {
    const schema = z.object({
      a: z.string(),
      b: z.number(),
    })
    assert(schema).toGenerateItself()
  })
  test('union', () => {
    const schema = z.union([z.string(), z.number(), z.boolean()])
    assert(schema).toGenerateItself()
  })
  test('discriminatedUnion', () => {
    const schema = z.discriminatedUnion('type', [
      z.object({ type: z.literal('A'), a: z.string() }),
      z.object({ type: z.literal('B'), b: z.number() }),
    ])
    assert(schema).toGenerateItself()
  })
  test('intersection', () => {
    const schema = z.intersection(z.object({ a: z.string() }), z.object({ b: z.number() }))
    assert(schema).toGenerateItself()
  })
  test('tuple', () => {
    const schema = z.tuple([z.string(), z.number()])
    assert(schema).toGenerateItself()
  })
  test('record', () => {
    const schema = z.record(z.string(), z.number())
    assert(schema).toGenerateItself()
  })
  test('map', () => {
    const schema = z.map(z.string(), z.number())
    assert(schema).toGenerateItself()
  })
  test('set', () => {
    const schema = z.set(z.string())
    assert(schema).toGenerateItself()
  })
  test('function with no argument', () => {
    const schema = z.function().returns(z.void())
    assert(schema).toGenerateItself()
  })
  test('function with multiple arguments', () => {
    const schema = z.function().args(z.number(), z.string()).returns(z.boolean())
    assert(schema).toGenerateItself()
  })
  test('lazy', () => {
    const schema = z.lazy(() => z.string())
    assert(schema).toGenerateItself()
  })
  test('literal string', () => {
    const schema = z.literal('banana')
    assert(schema).toGenerateItself()
  })
  test('literal number', () => {
    const schema = z.literal(42)
    assert(schema).toGenerateItself()
  })
  test('literal symbol', () => {
    const source = z.literal(Symbol('banana'))
    const dest = evalZui(toTypescript(source)) as ZodLiteral

    expect(dest instanceof ZodLiteral).toBe(true)
    const value = dest.value as symbol
    expect(typeof value).toBe('symbol')
    expect(value.description).toBe('banana')
  })
  test('literal bigint', () => {
    const schema = z.literal(BigInt(42))
    assert(schema).toGenerateItself()
  })
  test('literal boolean', () => {
    const schema = z.literal(true)
    assert(schema).toGenerateItself()
  })
  test('literal null', () => {
    const schema = z.literal(null)
    assert(schema).toGenerateItself()
  })
  test('literal undefined', () => {
    const schema = z.literal(undefined)
    assert(schema).toGenerateItself()
  })
  test('enum', () => {
    const schema = z.enum(['banana', 'apple', 'orange'])
    assert(schema).toGenerateItself()
  })
  test('effects', () => {
    const schema = z.string().transform((s) => s.toUpperCase())
    assert(schema).toThrowErrorWhenGenerating()
  })
  test('nativeEnum', () => {
    const schema = z.nativeEnum({
      Banana: 'banana',
      Apple: 'apple',
      Orange: 'orange',
    })
    assert(schema).toThrowErrorWhenGenerating()
  })
  test('optional', () => {
    const schema = z.optional(z.string())
    assert(schema).toGenerateItself()
  })
  test('nullable', () => {
    const schema = z.nullable(z.string())
    assert(schema).toGenerateItself()
  })
  test('default', () => {
    const schema1 = z.string().default('banana')
    assert(schema1).toGenerateItself()

    const schema2 = z.string().array().default(['banana'])
    assert(schema2).toGenerateItself()
  })
  test('catch', () => {
    const schema = z.string().catch('banana')
    assert(schema).toThrowErrorWhenGenerating()
  })
  test('promise', () => {
    const schema = z.promise(z.string())
    assert(schema).toGenerateItself()
  })
  test('branded', () => {
    const schema = z.string().brand('MyString')
    assert(schema).toThrowErrorWhenGenerating()
  })
  test('pipeline', () => {
    const schema = z.pipeline(z.string(), z.number())
    assert(schema).toThrowErrorWhenGenerating()
  })
  test('symbol', () => {
    const schema = z.symbol()
    assert(schema).toThrowErrorWhenGenerating()
  })
  test('readonly', () => {
    const schema = z.readonly(z.string())
    assert(schema).toGenerateItself()
  })
  test('ref', () => {
    const schema = z.ref('#item')
    assert(schema).toGenerateItself()
  })

  describe.concurrent('first-party zod modifiers', () => {
    test('describe', () => {
      // Arrange
      const description = 'patate'
      const schema = z.string().describe(description)

      // Act
      const evaluated = evalZui(toTypescript(schema))

      // Assert
      assert(schema).toGenerateItself()
      expect(evaluated.description).toBe(description)
    })
  })

  describe.concurrent('zui extensions', () => {
    test('title', () => {
      // Arrange
      const title = 'patate'
      const schema = z.string().title(title)

      // Act & Assert
      const evaluated = evalZui(toTypescript(schema))
      assert(schema).toGenerateItself()
      expect(evaluated.getMetadata().title).toBe(title)
    })

    test('displayAs', () => {
      // Arrange
      const testComponentDefinitions = {
        string: {
          customstringcomponent: {
            id: 'customstringcomponent',
            params: z.object({ multiline: z.boolean() }),
          },
        },
        array: {},
        object: {},
        boolean: {},
        number: {},
        discriminatedUnion: {},
      } as const satisfies UIComponentDefinitions
      const schema = z
        .string()
        .displayAs<typeof testComponentDefinitions>({ id: 'customstringcomponent', params: { multiline: true } })

      // Act & Assert
      const evaluated = evalZui(toTypescript(schema))
      assert(schema).toGenerateItself()
      expect(evaluated.getMetadata().displayAs).toEqual([
        'customstringcomponent',
        {
          multiline: true,
        },
      ])
    })

    test('disabled', () => {
      // Arrange
      const schema = z.string().disabled()

      // Act & Assert
      const evaluated = evalZui(toTypescript(schema))
      assert(schema).toGenerateItself()
      expect(evaluated.getMetadata().disabled).toBe(true)
    })

    test('disabled(false)', () => {
      // Arrange
      const schema = z.string().disabled(false)

      // Act & Assert
      const evaluated = evalZui(toTypescript(schema))
      assert(schema).toGenerateItself()
      expect(evaluated.getMetadata().disabled).toBe(undefined)
    })

    test('disabled(fn: bool)', () => {
      // Arrange
      const schema = z.string().disabled(() => true)

      // Act & Assert
      const evaluated = evalZui(toTypescript(schema))
      assert(schema).toGenerateItself()
      expect(evaluated.getMetadata().disabled).toBe('()=>true')
    })

    test('hidden', () => {
      // Arrange
      const schema = z.string().hidden()

      // Act & Assert
      const evaluated = evalZui(toTypescript(schema))
      assert(schema).toGenerateItself()
      expect(evaluated.getMetadata().hidden).toBe(true)
    })

    test('hidden(false)', () => {
      // Arrange
      const schema = z.string().hidden(false)

      // Act & Assert
      const evaluated = evalZui(toTypescript(schema))
      assert(schema).toGenerateItself()
      expect(evaluated.getMetadata().hidden).toBe(undefined)
    })

    test('hidden(fn: bool)', () => {
      // Arrange
      const schema = z.string().hidden(() => true)

      // Act & Assert
      const evaluated = evalZui(toTypescript(schema))
      assert(schema).toGenerateItself()
      expect(evaluated.getMetadata().hidden).toBe('()=>true')
    })

    test('placeholder', () => {
      // Arrange
      const schema = z.string().placeholder('patate')

      // Act & Assert
      const evaluated = evalZui(toTypescript(schema))
      assert(schema).toGenerateItself()
      expect(evaluated.getMetadata().placeholder).toBe('patate')
    })

    test('secret', () => {
      // Arrange
      const schema = z.string().secret()

      // Act & Assert
      const evaluated = evalZui(toTypescript(schema))
      assert(schema).toGenerateItself()
      expect(evaluated.getMetadata().secret).toBe(true)
    })

    test('metadata', () => {
      // Arrange
      const schema = z.string().metadata({ patate: 'pilée' })

      // Act & Assert
      const evaluated = evalZui(toTypescript(schema))
      assert(schema).toGenerateItself()
      expect(evaluated.getMetadata().patate).toBe('pilée')
    })
  })
})
