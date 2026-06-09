import { test, expect } from 'vitest'
import { z } from '../../zui'
import { IntegrationDefinition } from '.'
import { InterfaceDefinition } from '../../interface'
import { InterfacePackage } from '../../package'

test('integration with channel extending an interface with same channel merges channel tags', () => {
  // arrange
  const intrface = new InterfaceDefinition({
    name: 'foo',
    version: '0.0.0',
    channels: {
      theChannel: {
        messages: {},
      },
    },
  })

  const intrfacePackage = {
    type: 'interface',
    name: 'foo',
    version: '0.0.0',
    definition: intrface,
  } satisfies InterfacePackage

  // act
  const integration = new IntegrationDefinition({
    name: 'foo',
    version: '0.0.0',
    channels: {
      theChannel: {
        messages: {},
        conversation: { tags: { foo: {} } },
        message: { tags: { foo: {} } },
      },
    },
  }).extend(intrfacePackage, () => ({
    entities: {},
    channels: {
      theChannel: {
        conversation: {
          tags: {
            bar: {},
          },
        },
        message: {
          tags: {
            bar: {},
          },
        },
      },
    },
  }))

  // assert
  const actual = integration.channels!.theChannel
  const expected = {
    messages: {},
    conversation: { tags: { foo: {}, bar: {} } },
    message: { tags: { foo: {}, bar: {} } },
  }
  expect(actual).toEqual(expected)
})

const variantA = z.object({ type: z.literal('a'), foo: z.string() })
const variantB = z.object({ type: z.literal('b'), bar: z.number() })

const makeDiscriminatedUnionPkg = (schema: z.ZodDiscriminatedUnion): InterfacePackage => {
  const intrface = new InterfaceDefinition({
    name: 'foo',
    version: '0.0.0',
    events: { theEvent: { schema: () => schema } },
  })
  return { type: 'interface', name: 'foo', version: '0.0.0', definition: intrface }
}

test('extending with discriminated union events merges the variants', () => {
  const integration = new IntegrationDefinition({
    name: 'foo',
    version: '0.0.0',
    events: {
      theEvent: { schema: z.discriminatedUnion('type', [variantA]) },
    },
  }).extend(makeDiscriminatedUnionPkg(z.discriminatedUnion('type', [variantB])), () => ({
    entities: {},
  }))

  const merged = integration.events!.theEvent.schema as z.ZodDiscriminatedUnion
  expect(merged._def.typeName).toBe('ZodDiscriminatedUnion')
  expect(merged._def.discriminator).toBe('type')
  expect(merged._def.options).toHaveLength(2)
})

test('extending with discriminated union actions merges input and output variants', () => {
  const intrface = new InterfaceDefinition({
    name: 'foo',
    version: '0.0.0',
    actions: {
      theAction: {
        input: { schema: () => z.discriminatedUnion('type', [variantA]) },
        output: { schema: () => z.discriminatedUnion('type', [variantA]) },
      },
    },
  })
  const pkg: InterfacePackage = { type: 'interface', name: 'foo', version: '0.0.0', definition: intrface }

  const integration = new IntegrationDefinition({
    name: 'foo',
    version: '0.0.0',
    actions: {
      theAction: {
        input: { schema: z.discriminatedUnion('type', [variantB]) },
        output: { schema: z.discriminatedUnion('type', [variantB]) },
      },
    },
  }).extend(pkg, () => ({ entities: {} }))

  const mergedInput = integration.actions!.theAction.input.schema as z.ZodDiscriminatedUnion
  const mergedOutput = integration.actions!.theAction.output.schema as z.ZodDiscriminatedUnion
  expect(mergedInput._def.options).toHaveLength(2)
  expect(mergedOutput._def.options).toHaveLength(2)
})

test('extending discriminated unions with duplicate discriminator values throws', () => {
  const integration = new IntegrationDefinition({
    name: 'foo',
    version: '0.0.0',
    events: {
      theEvent: { schema: z.discriminatedUnion('type', [variantA]) },
    },
  })

  expect(() => integration.extend(makeDiscriminatedUnionPkg(z.discriminatedUnion('type', [variantA])), () => ({ entities: {} }))).toThrow(
    "Cannot merge discriminated unions: duplicate discriminator value 'a' for key 'type'"
  )
})

test('extending discriminated unions with different discriminator keys throws', () => {
  const withOtherDiscriminator = z.discriminatedUnion('kind', [z.object({ kind: z.literal('x'), foo: z.string() })])

  const integration = new IntegrationDefinition({
    name: 'foo',
    version: '0.0.0',
    events: {
      theEvent: { schema: z.discriminatedUnion('type', [variantA]) },
    },
  })

  expect(() => integration.extend(makeDiscriminatedUnionPkg(withOtherDiscriminator), () => ({ entities: {} }))).toThrow(
    "Cannot merge discriminated unions with different discriminator keys: 'type' and 'kind'"
  )
})
