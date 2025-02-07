import { test, expect } from 'vitest'
import { BotImplementation } from './implementation'

const createBot = () => new BotImplementation({ actions: {}, plugins: {} })

test('getting text message handlers also returns global handlers', () => {
  const bot = createBot()

  bot.on.message('text', async () => {})
  bot.on.message('*', async () => {})

  const textHandlers = bot.messageHandlers['text']
  expect(textHandlers?.length).toEqual(2)
})

test('getting global message handlers only returns global handlers once', () => {
  const bot = createBot()

  bot.on.message('text', async () => {})
  bot.on.message('*', async () => {})

  const commonHandlers = bot.messageHandlers['*']
  expect(commonHandlers?.length).toEqual(1)
})

test('getting foo event handlers also returns global handlers', () => {
  const bot = createBot()

  bot.on.event('foo', async function foo() {})
  bot.on.event('*', async function bar() {})

  const fooHandlers = bot.eventHandlers['foo']
  expect(fooHandlers?.length).toEqual(2)
})

test('getting global event handlers only returns global handlers once', () => {
  const bot = createBot()

  bot.on.event('foo', async () => {})
  bot.on.event('*', async () => {})

  const commonHandlers = bot.eventHandlers['*']
  expect(commonHandlers?.length).toEqual(1)
})

test('getting foo stateExpired handlers also returns global handlers', () => {
  const bot = createBot()

  bot.on.stateExpired('foo', async function foo() {})
  bot.on.stateExpired('*', async function bar() {})

  const fooHandlers = bot.stateExpiredHandlers['foo']
  expect(fooHandlers?.length).toEqual(2)
})

test('getting global stateExpired handlers only returns global handlers once', () => {
  const bot = createBot()

  bot.on.stateExpired('foo', async () => {})
  bot.on.stateExpired('*', async () => {})

  const commonHandlers = bot.stateExpiredHandlers['*']
  expect(commonHandlers?.length).toEqual(1)
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
  expect(fooHandlers?.length).toEqual(2)
})

test('getting global before_incoming_event hook handlers only returns global handlers once', () => {
  const bot = createBot()

  bot.on.beforeIncomingEvent('foo', async () => {
    return undefined
  })
  bot.on.beforeIncomingEvent('*', async () => {
    return undefined
  })

  const commonHandlers = bot.hookHandlers.before_incoming_event['*']
  expect(commonHandlers?.length).toEqual(1)
})

// TODO: add a test to ensure plugin handlers are also returned
