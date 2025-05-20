import { test, expect } from 'vitest'
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
