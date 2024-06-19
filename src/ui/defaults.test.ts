import { describe } from 'vitest'
import z from '../z'
import { getDefaultValues } from './hooks/useFormData'

// an overly complicated schema, containing discriminated union, defaults, optional values, nullable values, and arrays, maps and objects

describe('defaults', () => {
  it('should populate undefined correctly', () => {
    const optionalSchema = z.object({
      astring: z.string().optional(),
      astringnonoptional: z.string(),
      anumber: z.number().optional(),
      anumbernonoptional: z.number(),
      abool: z.boolean().optional(),
      aboolnonoptional: z.boolean(),
      anArray: z.array(z.string()).optional(),
      anArraynonoptional: z.array(z.string()),
      anObject: z
        .object({
          astring: z.string().optional(),
        })
        .optional(),
      anObjectnonoptional: z.object({
        astring: z.string(),
      }),
    })
    expect(getDefaultValues(optionalSchema.toJsonSchema())).toMatchObject({
      astring: undefined,
      astringnonoptional: '',
      anumber: undefined,
      anumbernonoptional: 0,
      abool: undefined,
      aboolnonoptional: false,
      anArray: undefined,
      anArraynonoptional: [],
      anObject: undefined,
      anObjectnonoptional: { astring: '' },
    })
  })

  it('should populate defaults correctly', () => {
    const aDefaultsSchema = z.object({
      astring: z.string().default('a'),
      anumber: z.number().default(1),
      abool: z.boolean().default(true),
      anArray: z.array(z.string()).default(['a']),
      anObject: z.object({
        astring: z.string().default('a'),
      }),
    })

    expect(getDefaultValues(aDefaultsSchema.toJsonSchema())).toMatchObject({
      astring: 'a',
      anumber: 1,
      abool: true,
      anArray: ['a'],
      anObject: { astring: 'a' },
    })
  })

  it('should populate nullable correctly', () => {
    const nullableSchema = z.object({
      astring: z.string().nullable(),
      anumber: z.number().nullable(),
      abool: z.boolean().nullable(),
      anArray: z.array(z.string()).nullable(),
      anObject: z.object({
        astring: z.string().nullable(),
      }),
    })

    expect(getDefaultValues(nullableSchema.toJsonSchema())).toMatchObject({
      astring: null,
      anumber: null,
      abool: null,
      anArray: null,
      anObject: {
        astring: null,
      },
    })
  })
  it('should resolve the defaults of a complex object definition', () => {
    const complex = z.object({
      astring: z.string(),
      astringdefault: z.string().default('a'),
      astringoptional: z.string().optional(),
      astringnullable: z.string().nullable(),
      astringdefaultoptional: z.string().default('a').optional(),
      astringdefaultnullable: z.string().default('a').nullable(),

      abool: z.boolean(),
      abooldefault: z.boolean().default(true),
      abooloptional: z.boolean().optional(),
      aboolnullable: z.boolean().nullable(),
      abooldefaultoptional: z.boolean().default(true).optional(),
      abooldefaultnullable: z.boolean().default(true).nullable(),

      aNumber: z.number(),
      aNumberdefault: z.number().default(1),
      aNumberoptional: z.number().optional(),
      aNumbernullable: z.number().nullable(),
      aNumberdefaultoptional: z.number().default(1).optional(),
      aNumberdefaultnullable: z.number().default(1).nullable(),

      anArray: z.array(z.string()),
      anArraydefault: z.array(z.string()).default(['a']),
      anArrayoptional: z.array(z.string()).optional(),
      anArraynullable: z.array(z.string()).nullable(),
      anArraydefaultoptional: z.array(z.string()).default(['a']).optional(),
      anArraydefaultnullable: z.array(z.string()).default(['a']).nullable(),

      anObject: z.object({
        astring: z.string(),
      }),
      anObjectdefault: z
        .object({
          astring: z.string().default('a'),
        })
        .default({ astring: 'a' }),
      anObjectoptional: z
        .object({
          astring: z.string(),
        })
        .optional(),
      anObjectnullable: z
        .object({
          astring: z.string(),
        })
        .nullable(),
      anObjectdefaultoptional: z
        .object({
          astring: z.string().default('a'),
        })
        .default({ astring: 'a' })
        .optional(),
      anObjectdefaultnullable: z
        .object({
          astring: z.string().default('a'),
        })
        .default({ astring: 'a' })
        .nullable(),

      aDiscriminatedUnion: z.discriminatedUnion('type', [
        z.object({
          type: z.literal('astring'),
          value: z.string().default('a'),
        }),
        z.object({
          type: z.literal('anumber'),
          value: z.number().default(1),
        }),
      ]),

      aDiscriminatedUnionoptional: z
        .discriminatedUnion('type', [
          z.object({
            type: z.literal('astring'),
            value: z.string().default('a'),
          }),
          z.object({
            type: z.literal('anumber'),
            value: z.number().default(1),
          }),
        ])
        .optional(),

      aDiscriminatedUnionnullable: z
        .discriminatedUnion('type', [
          z.object({
            type: z.literal('astring'),
            value: z.string().default('a'),
          }),
          z.object({
            type: z.literal('anumber'),
            value: z.number().default(1),
          }),
        ])
        .nullable(),

      aDiscriminatedUniondefault: z
        .discriminatedUnion('type', [
          z.object({
            type: z.literal('astring'),
            value: z.string().default('a'),
          }),
          z.object({
            type: z.literal('anumber'),
            value: z.number().default(1),
          }),
        ])
        .default({ type: 'astring', value: 'a' }),

      aDiscriminatedUniondefaultoptional: z
        .discriminatedUnion('type', [
          z.object({
            type: z.literal('astring'),
            value: z.string().default('a'),
          }),
          z.object({
            type: z.literal('anumber'),
            value: z.number().default(1),
          }),
        ])
        .default({ type: 'astring', value: 'a' })
        .optional(),

      aDiscriminatedUniondefaultnullable: z
        .discriminatedUnion('type', [
          z.object({
            type: z.literal('astring'),
            value: z.string().default('a'),
          }),
          z.object({
            type: z.literal('anumber'),
            value: z.number().default(1),
          }),
        ])
        .default({ type: 'astring', value: 'a' })
        .nullable(),
    })

    expect(getDefaultValues(complex.toJsonSchema())).toMatchObject({
      astring: '',
      astringdefault: 'a',
      astringoptional: undefined,
      astringnullable: null,
      astringdefaultoptional: 'a',
      astringdefaultnullable: 'a',

      abool: false,
      abooldefault: true,
      abooloptional: undefined,
      aboolnullable: null,
      abooldefaultoptional: true,
      abooldefaultnullable: true,

      aNumber: 0,
      aNumberdefault: 1,
      aNumberoptional: undefined,
      aNumbernullable: null,
      aNumberdefaultoptional: 1,
      aNumberdefaultnullable: 1,

      anArray: [],
      anArraydefault: ['a'],
      anArrayoptional: undefined,
      anArraynullable: null,
      anArraydefaultoptional: ['a'],
      anArraydefaultnullable: ['a'],

      anObject: { astring: '' },
      anObjectdefault: { astring: 'a' },
      anObjectoptional: undefined,
      anObjectnullable: null,
      anObjectdefaultoptional: { astring: 'a' },

      aDiscriminatedUnion: { type: 'astring', value: 'a' },
      aDiscriminatedUnionoptional: undefined,
      aDiscriminatedUnionnullable: null,
      aDiscriminatedUniondefault: { type: 'astring', value: 'a' },
      aDiscriminatedUniondefaultoptional: { type: 'astring', value: 'a' },
      aDiscriminatedUniondefaultnullable: { type: 'astring', value: 'a' },
    })
  })
})
