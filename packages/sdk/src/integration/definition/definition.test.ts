import { test, expect } from 'vitest'
import { IntegrationDefinition } from '.'
import { InterfaceDefinition } from '../../interface'
import { InterfacePackage } from '../../package'
import { z } from '../../zui'

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

test('extend produces a definition whose props reflect the extension, so it can be reconstructed from props', () => {
  // arrange
  const intrface = new InterfaceDefinition({
    name: 'files-readonly',
    version: '0.0.0',
    actions: {
      listItemsInFolder: {
        input: { schema: () => z.object({ folderId: z.string() }) },
        output: { schema: () => z.object({ items: z.array(z.string()) }) },
      },
    },
  })

  const intrfacePackage = {
    type: 'interface',
    id: 'some-interface-id',
    name: 'files-readonly',
    version: '0.0.0',
    definition: intrface,
  } satisfies InterfacePackage

  // act
  const integration = new IntegrationDefinition({
    name: 'github',
    version: '0.0.0',
    actions: {
      findTarget: {
        input: { schema: z.object({ query: z.string() }) },
        output: { schema: z.object({ id: z.string() }) },
      },
    },
  }).extend(intrfacePackage, () => ({ entities: {} }))

  // assert — the instance carries the extension
  expect(Object.keys(integration.interfaces ?? {})).toContain('files-readonly')
  expect(Object.keys(integration.actions ?? {})).toEqual(expect.arrayContaining(['findTarget', 'listItemsInFolder']))

  // assert — props reflect the extension (the instance is built from these props, so they stay consistent)
  expect(integration.props.interfaces).toBe(integration.interfaces)
  expect(integration.props.actions).toBe(integration.actions)
  expect(integration.props.events).toBe(integration.events)
  expect(integration.props.channels).toBe(integration.channels)

  // assert — reconstructing from props keeps the extension
  const cloned = new IntegrationDefinition({ ...integration.props, name: 'some-handle/github' })
  expect(Object.keys(cloned.interfaces ?? {})).toContain('files-readonly')
  expect(Object.keys(cloned.actions ?? {})).toEqual(expect.arrayContaining(['findTarget', 'listItemsInFolder']))
})
