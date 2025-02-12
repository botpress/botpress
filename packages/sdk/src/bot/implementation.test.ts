import { test, expect } from 'vitest'
import { BotImplementation } from './implementation'

const createBot = () => new BotImplementation({ actions: {}, plugins: {} })

test('getting text message handlers also returns global handlers', () => {
  const bot = createBot()

  bot.on.message('text', async function foo() {})
  bot.on.message('*', async function bar() {})

  const textHandlers = bot.messageHandlers['text']
  expect(textHandlers?.map((h) => h.name)).toEqual(['foo', 'bar'])
})

test('getting global message handlers only returns global handlers once', () => {
  const bot = createBot()

  bot.on.message('text', async function foo() {})
  bot.on.message('*', async function bar() {})

  const commonHandlers = bot.messageHandlers['*']
  expect(commonHandlers?.map((h) => h.name)).toEqual(['bar'])
})

test('getting foo event handlers also returns global handlers', () => {
  const bot = createBot()

  bot.on.event('foo', async function foo() {})
  bot.on.event('*', async function bar() {})

  const fooHandlers = bot.eventHandlers['foo']
  expect(fooHandlers?.map((h) => h.name)).toEqual(['foo', 'bar'])
})

test('getting global event handlers only returns global handlers once', () => {
  const bot = createBot()

  bot.on.event('foo', async function foo() {})
  bot.on.event('*', async function bar() {})

  const commonHandlers = bot.eventHandlers['*']
  expect(commonHandlers?.map((h) => h.name)).toEqual(['bar'])
})

test('getting foo stateExpired handlers also returns global handlers', () => {
  const bot = createBot()

  bot.on.stateExpired('foo', async function foo() {})
  bot.on.stateExpired('*', async function bar() {})

  const fooHandlers = bot.stateExpiredHandlers['foo']
  expect(fooHandlers?.map((h) => h.name)).toEqual(['foo', 'bar'])
})

test('getting global stateExpired handlers only returns global handlers once', () => {
  const bot = createBot()

  bot.on.stateExpired('foo', async function foo() {})
  bot.on.stateExpired('*', async function bar() {})

  const commonHandlers = bot.stateExpiredHandlers['*']
  expect(commonHandlers?.map((h) => h.name)).toEqual(['bar'])
})

test('getting foo before_incoming_event hook handlers also returns global handlers', () => {
  const bot = createBot()

  bot.on.beforeIncomingEvent('foo', async function foo() {
    return undefined
  })
  bot.on.beforeIncomingEvent('*', async function bar() {
    return undefined
  })

  const fooHandlers = bot.hookHandlers.before_incoming_event['foo']
  expect(fooHandlers?.map((h) => h.name)).toEqual(['foo', 'bar'])
})

test('getting global before_incoming_event hook handlers only returns global handlers once', () => {
  const bot = createBot()

  bot.on.beforeIncomingEvent('foo', async function foo() {
    return undefined
  })
  bot.on.beforeIncomingEvent('*', async function bar() {
    return undefined
  })

  const commonHandlers = bot.hookHandlers.before_incoming_event['*']
  expect(commonHandlers?.map((h) => h.name)).toEqual(['bar'])
})

// TODO: add a test to ensure plugin handlers are also returned
