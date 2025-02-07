import { test, expect } from 'vitest'
import { PluginImplementation } from './implementation'

const createPlugin = () =>
  new PluginImplementation({ actions: {} }).initialize({
    configuration: {},
    interfaces: {},
  })

test('getting text message handlers also returns global handlers', () => {
  const plugin = createPlugin()

  plugin.on.message('text', async function foo() {})
  plugin.on.message('*', async function bar() {})

  const textHandlers = plugin.messageHandlers['text']
  expect(textHandlers?.map((handler) => handler.name)).toEqual(['foo', 'bar'])
})

test('getting global message handlers only returns global handlers once', () => {
  const plugin = createPlugin()

  plugin.on.message('text', async function foo() {})
  plugin.on.message('*', async function bar() {})

  const commonHandlers = plugin.messageHandlers['*']
  expect(commonHandlers?.map((handler) => handler.name)).toEqual(['bar'])
})

test('getting foo event handlers also returns global handlers', () => {
  const plugin = createPlugin()

  plugin.on.event('foo', async function foo() {})
  plugin.on.event('*', async function bar() {})

  const fooHandlers = plugin.eventHandlers['foo']
  expect(fooHandlers?.map((handler) => handler.name)).toEqual(['foo', 'bar'])
})

test('getting global event handlers only returns global handlers once', () => {
  const plugin = createPlugin()

  plugin.on.event('foo', async function foo() {})
  plugin.on.event('*', async function bar() {})

  const commonHandlers = plugin.eventHandlers['*']
  expect(commonHandlers?.map((handler) => handler.name)).toEqual(['bar'])
})

test('getting creatable:itemCreated event handlers also returns interface handlers', () => {
  const plugin = new PluginImplementation({ actions: {} }).initialize({
    configuration: {},
    interfaces: {
      creatable: {
        name: 'foo',
        version: '0.0.0',
        actions: {},
        events: {
          itemCreated: { name: 'fooCreated' },
        },
        channels: {},
        entities: {},
      },
    },
  })

  plugin.on.event('foo:fooCreated', async function handler1() {})
  plugin.on.event('creatable:itemCreated', async function handler2() {})

  const fooCreatedHandlers = plugin.eventHandlers['foo:fooCreated']
  expect(fooCreatedHandlers?.map((handler) => handler.name)).toEqual(['handler1', 'handler2'])

  const itemCreatedHandlers = plugin.eventHandlers['creatable:itemCreated']
  expect(itemCreatedHandlers?.map((handler) => handler.name)).toEqual(['handler2'])
})

test('getting foo stateExpired handlers also returns global handlers', () => {
  const plugin = createPlugin()

  plugin.on.stateExpired('foo', async function foo() {})
  plugin.on.stateExpired('*', async function bar() {})

  const fooHandlers = plugin.stateExpiredHandlers['foo']
  expect(fooHandlers?.map((handler) => handler.name)).toEqual(['foo', 'bar'])
})

test('getting global stateExpired handlers only returns global handlers once', () => {
  const plugin = createPlugin()

  plugin.on.stateExpired('foo', async function foo() {})
  plugin.on.stateExpired('*', async function bar() {})

  const commonHandlers = plugin.stateExpiredHandlers['*']
  expect(commonHandlers?.map((handler) => handler.name)).toEqual(['bar'])
})

test('getting foo before_incoming_event hook handlers also returns global handlers', () => {
  const plugin = createPlugin()

  plugin.on.beforeIncomingEvent('foo', async function foo() {
    return undefined
  })
  plugin.on.beforeIncomingEvent('*', async function bar() {
    return undefined
  })

  const fooHandlers = plugin.hookHandlers.before_incoming_event['foo']
  expect(fooHandlers?.map((handler) => handler.name)).toEqual(['foo', 'bar'])
})

test('getting global before_incoming_event hook handlers only returns global handlers once', () => {
  const plugin = createPlugin()

  plugin.on.beforeIncomingEvent('foo', async function foo() {
    return undefined
  })
  plugin.on.beforeIncomingEvent('*', async function bar() {
    return undefined
  })

  const commonHandlers = plugin.hookHandlers.before_incoming_event['*']
  expect(commonHandlers?.map((handler) => handler.name)).toEqual(['bar'])
})
