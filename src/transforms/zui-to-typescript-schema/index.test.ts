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

const generate = <Z extends ZodType>(source: Z): Z => evalZui(toTypescript(source)) as Z

const assert = (source: ZodType) => ({
  toGenerateItself() {
    const destination = generate(source)
    let msg: string | undefined
    try {
      msg = `Expected ${JSON.stringify(source._def)} to equal ${JSON.stringify(destination._def)}`
    } catch {}
    expect(source.isEqual(destination), msg).toBe(true)
  },
  toThrowErrorWhenGenerating() {
    const fn = () => toTypescript(source)
    expect(fn).toThrowError(errors.ZuiToTypescriptSchemaError)
  },
})

describe.concurrent('toTypescriptZuiString', () => {
  describe.concurrent('string', () => {
    test('no checks', () => {
      const schema = z.string()
      assert(schema).toGenerateItself()
      const evaluated = generate(schema)
      expect(evaluated._def.checks).toEqual([])
    })
    test('min', () => {
      const schema = z.string().min(42)
      assert(schema).toGenerateItself()
      const evaluated = generate(schema)
      expect(evaluated._def.checks).toEqual([{ kind: 'min', value: 42, message: undefined }])
    })
    test('max', () => {
      const schema = z.string().max(42)
      assert(schema).toGenerateItself()
      const evaluated = generate(schema)
      expect(evaluated._def.checks).toEqual([{ kind: 'max', value: 42, message: undefined }])
    })
    test('length', () => {
      const schema = z.string().length(42)
      assert(schema).toGenerateItself()
      const evaluated = generate(schema)
      expect(evaluated._def.checks).toEqual([{ kind: 'length', value: 42, message: undefined }])
    })
    test('email', () => {
      const schema = z.string().email()
      assert(schema).toGenerateItself()
      const evaluated = generate(schema)
      expect(evaluated._def.checks).toEqual([{ kind: 'email', message: undefined }])
    })
    test('url', () => {
      const schema = z.string().url()
      assert(schema).toGenerateItself()
      const evaluated = generate(schema)
      expect(evaluated._def.checks).toEqual([{ kind: 'url', message: undefined }])
    })
    test('emoji', () => {
      const schema = z.string().emoji()
      assert(schema).toGenerateItself()
      const evaluated = generate(schema)
      expect(evaluated._def.checks).toEqual([{ kind: 'emoji', message: undefined }])
    })
    test('uuid', () => {
      const schema = z.string().uuid()
      assert(schema).toGenerateItself()
      const evaluated = generate(schema)
      expect(evaluated._def.checks).toEqual([{ kind: 'uuid', message: undefined }])
    })
    test('cuid', () => {
      const schema = z.string().cuid()
      assert(schema).toGenerateItself()
      const evaluated = generate(schema)
      expect(evaluated._def.checks).toEqual([{ kind: 'cuid', message: undefined }])
    })
    test('cuid2', () => {
      const schema = z.string().cuid2()
      assert(schema).toGenerateItself()
      const evaluated = generate(schema)
      expect(evaluated._def.checks).toEqual([{ kind: 'cuid2', message: undefined }])
    })
    test('ulid', () => {
      const schema = z.string().ulid()
      assert(schema).toGenerateItself()
      const evaluated = generate(schema)
      expect(evaluated._def.checks).toEqual([{ kind: 'ulid', message: undefined }])
    })
    test('includes', () => {
      const schema = z.string().includes('banana')
      assert(schema).toGenerateItself()
      const evaluated = generate(schema)
      expect(evaluated._def.checks).toEqual([{ kind: 'includes', value: 'banana', message: undefined }])
    })
    test('startsWith', () => {
      const schema = z.string().startsWith('banana')
      assert(schema).toGenerateItself()
      const evaluated = generate(schema)
      expect(evaluated._def.checks).toEqual([{ kind: 'startsWith', value: 'banana', message: undefined }])
    })
    test('endsWith', () => {
      const schema = z.string().endsWith('banana')
      assert(schema).toGenerateItself()
      const evaluated = generate(schema)
      expect(evaluated._def.checks).toEqual([{ kind: 'endsWith', value: 'banana', message: undefined }])
    })
    test('regex', () => {
      const schema = z.string().regex(/banana/g)
      assert(schema).toGenerateItself()
      const evaluated = generate(schema)
      expect(evaluated._def.checks).toEqual([{ kind: 'regex', regex: /banana/g, message: undefined }])
    })
    test('trim', () => {
      const schema = z.string().trim()
      assert(schema).toGenerateItself()
      const evaluated = generate(schema)
      expect(evaluated._def.checks).toEqual([{ kind: 'trim', message: undefined }])
    })
    test('toLowerCase', () => {
      const schema = z.string().toLowerCase()
      assert(schema).toGenerateItself()
      const evaluated = generate(schema)
      expect(evaluated._def.checks).toEqual([{ kind: 'toLowerCase', message: undefined }])
    })
    test('toUpperCase', () => {
      const schema = z.string().toUpperCase()
      assert(schema).toGenerateItself()
      const evaluated = generate(schema)
      expect(evaluated._def.checks).toEqual([{ kind: 'toUpperCase', message: undefined }])
    })
    test('datetime', () => {
      const schema = z.string().datetime()
      assert(schema).toGenerateItself()
      const evaluated = generate(schema)
      expect(evaluated._def.checks).toEqual([{ kind: 'datetime', message: undefined, offset: false, precision: null }])
    })
    test('ip', () => {
      const schema = z.string().ip()
      assert(schema).toGenerateItself()
      const evaluated = generate(schema)
      expect(evaluated._def.checks).toEqual([{ kind: 'ip', message: undefined }])
    })
  })
  describe.concurrent('number', () => {
    test('no checks', () => {
      const schema = z.number()
      assert(schema).toGenerateItself()
      const evaluated = generate(schema)
      expect(evaluated._def.checks).toEqual([])
    })
    test('min', () => {
      const schema = z.number().min(42)
      assert(schema).toGenerateItself()
      const evaluated = generate(schema)
      expect(evaluated._def.checks).toEqual([{ kind: 'min', value: 42, message: undefined, inclusive: true }])
    })
    test('max', () => {
      const schema = z.number().max(42)
      assert(schema).toGenerateItself()
      const evaluated = generate(schema)
      expect(evaluated._def.checks).toEqual([{ kind: 'max', value: 42, message: undefined, inclusive: true }])
    })
    test('int', () => {
      const schema = z.number().int()
      assert(schema).toGenerateItself()
      const evaluated = generate(schema)
      expect(evaluated._def.checks).toEqual([{ kind: 'int', message: undefined }])
    })
    test('multipleOf', () => {
      const schema = z.number().multipleOf(42)
      assert(schema).toGenerateItself()
      const evaluated = generate(schema)
      expect(evaluated._def.checks).toEqual([{ kind: 'multipleOf', value: 42, message: undefined }])
    })
    test('finite', () => {
      const schema = z.number().finite()
      assert(schema).toGenerateItself()
      const evaluated = generate(schema)
      expect(evaluated._def.checks).toEqual([{ kind: 'finite', message: undefined }])
    })
  })
  test('nan', () => {
    const schema = z.nan()
    assert(schema).toGenerateItself()
  })
  describe.concurrent('bigint', () => {
    test('no checks', () => {
      const schema = z.bigint()
      assert(schema).toGenerateItself()
      const evaluated = generate(schema)
      expect(evaluated._def.checks).toEqual([])
    })
    test('min', () => {
      const schema = z.bigint().min(BigInt(42))
      assert(schema).toGenerateItself()
      const evaluated = generate(schema)
      expect(evaluated._def.checks).toEqual([{ kind: 'min', value: BigInt(42), message: undefined, inclusive: true }])
    })
    test('max', () => {
      const schema = z.bigint().min(BigInt(42))
      assert(schema).toGenerateItself()
      const evaluated = generate(schema)
      expect(evaluated._def.checks).toEqual([{ kind: 'min', value: BigInt(42), message: undefined, inclusive: true }])
    })
    test('multipleOf', () => {
      const schema = z.bigint().min(BigInt(42))
      assert(schema).toGenerateItself()
      const evaluated = generate(schema)
      expect(evaluated._def.checks).toEqual([{ kind: 'min', value: BigInt(42), message: undefined, inclusive: true }])
    })
  })
  test('boolean', () => {
    const schema = z.boolean()
    assert(schema).toGenerateItself()
  })
  describe.concurrent('date', () => {
    test('no checks', () => {
      const schema = z.date()
      assert(schema).toGenerateItself()
      const evaluated = generate(schema)
      expect(evaluated._def.checks).toEqual([])
    })

    test('min', () => {
      const min = new Date()
      const schema = z.date().min(min)
      assert(schema).toGenerateItself()
      const evaluated = generate(schema)
      expect(evaluated._def.checks).toEqual([{ kind: 'min', value: min.getTime(), message: undefined }])
    })

    test('max', () => {
      const max = new Date()
      const schema = z.date().max(max)
      assert(schema).toGenerateItself()
      const evaluated = generate(schema)
      expect(evaluated._def.checks).toEqual([{ kind: 'max', value: max.getTime(), message: undefined }])
    })
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
  describe.concurrent('array', () => {
    test('no checks', () => {
      const schema = z.array(z.string())
      assert(schema).toGenerateItself()
    })

    test('min', () => {
      const schema = z.array(z.string()).min(42)
      assert(schema).toGenerateItself()
    })

    test('max', () => {
      const schema = z.array(z.string()).max(42)
      assert(schema).toGenerateItself()
    })

    test('length', () => {
      const schema = z.array(z.string()).length(42)
      assert(schema).toGenerateItself()
    })
  })
  test('object', () => {
    const schema = z.object({
      a: z.string(),
      b: z.number(),
    })
    assert(schema).toGenerateItself()
  })

  test('strict object', () => {
    const schema = z
      .object({
        a: z.string(),
        b: z.number(),
      })
      .strict()
    assert(schema).toGenerateItself()
  })

  test('passthrough object', () => {
    const schema = z
      .object({
        a: z.string(),
        b: z.number(),
      })
      .passthrough()
    assert(schema).toGenerateItself()
  })

  test('catchall object', () => {
    const schema = z
      .object({
        a: z.string(),
        b: z.number(),
      })
      .catchall(z.boolean())
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
  describe.concurrent('set', () => {
    test('no checks', () => {
      const schema = z.set(z.string())
      assert(schema).toGenerateItself()
    })

    test('min', () => {
      const schema = z.set(z.string()).min(42)
      assert(schema).toGenerateItself()
    })

    test('max', () => {
      const schema = z.set(z.string()).max(42)
      assert(schema).toGenerateItself()
    })
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
