import { describe, it, expect } from 'vitest'
import { BotImplementation } from './implementation'
import { PluginImplementation } from '../plugin'

describe('plain bot', () => {
  const createBot = () =>
    new BotImplementation({
      actions: {
        sayHi: async () => 'Hi',
      },
      plugins: {},
    })

  it('should return action when getting action handlers', () => {
    const bot = createBot()
    const actionHandler = bot.actionHandlers['sayHi']!
    expect(actionHandler.name).toEqual('sayHi')
  })

  it('should also return global handlers when getting text message handlers', () => {
    const bot = createBot()

    bot.on.message('text', async function foo() {})
    bot.on.message('*', async function bar() {})

    const textHandlers = bot.messageHandlers['text']
    expect(textHandlers?.map((h) => h.name)).toEqual(['foo', 'bar'])
  })

  it('should only return global handlers once when getting global message handlers', () => {
    const bot = createBot()

    bot.on.message('text', async function foo() {})
    bot.on.message('*', async function bar() {})

    const commonHandlers = bot.messageHandlers['*']
    expect(commonHandlers?.map((h) => h.name)).toEqual(['bar'])
  })

  it('should also return global handlers when getting foo event handlers', () => {
    const bot = createBot()

    bot.on.event('foo', async function foo() {})
    bot.on.event('*', async function bar() {})

    const fooHandlers = bot.eventHandlers['foo']
    expect(fooHandlers?.map((h) => h.name)).toEqual(['foo', 'bar'])
  })

  it('should only return global handlers once when getting global event handlers', () => {
    const bot = createBot()

    bot.on.event('foo', async function foo() {})
    bot.on.event('*', async function bar() {})

    const commonHandlers = bot.eventHandlers['*']
    expect(commonHandlers?.map((h) => h.name)).toEqual(['bar'])
  })

  it('should also return global handlers when getting foo stateExpired handlers', () => {
    const bot = createBot()

    bot.on.stateExpired('foo', async function foo() {})
    bot.on.stateExpired('*', async function bar() {})

    const fooHandlers = bot.stateExpiredHandlers['foo']
    expect(fooHandlers?.map((h) => h.name)).toEqual(['foo', 'bar'])
  })

  it('should only return global handlers once when getting global stateExpired handlers', () => {
    const bot = createBot()

    bot.on.stateExpired('foo', async function foo() {})
    bot.on.stateExpired('*', async function bar() {})

    const commonHandlers = bot.stateExpiredHandlers['*']
    expect(commonHandlers?.map((h) => h.name)).toEqual(['bar'])
  })

  it('should also returns global handlers when getting foo before_incoming_event hook handlers', () => {
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

  it('should only return global handlers once when getting global before_incoming_event hook handlers', () => {
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
})

describe('bot with plugins', () => {
  const createBot = () => {
    const sayFoo = async () => 'foo'
    const sayBar = async () => 'bar'

    const pluginFoo = new PluginImplementation({
      actions: {
        sayHello: sayFoo,
      },
    }).initialize({
      alias: 'foo',
      configuration: {},
      interfaces: {
        creatable: {
          name: 'github',
          version: '0.0.0',
          actions: {},
          events: {
            itemCreated: { name: 'prOpened' },
          },
          channels: {},
          entities: {},
        },
      },
    })

    const pluginBar = new PluginImplementation({
      actions: {
        sayHello: sayBar,
      },
    }).initialize({
      alias: 'bar',
      configuration: {},
      interfaces: {},
    })

    const bot = new BotImplementation({
      actions: {
        sayHi: async () => 'Hi',
      },
      plugins: {
        foo: pluginFoo,
        bar: pluginBar,
      },
    })

    return {
      bot,
      plugins: {
        foo: pluginFoo,
        bar: pluginBar,
      },
    }
  }

  it('should return plugin action when getting action handlers', () => {
    const { bot } = createBot()
    const fooActionHandler = bot.actionHandlers['foo#sayHello']!
    expect(fooActionHandler.name).toEqual('sayFoo')

    const barActionHandler = bot.actionHandlers['bar#sayHello']!
    expect(barActionHandler.name).toEqual('sayBar')
  })

  it('should also return plugin handlers when getting message handlers', () => {
    const { bot, plugins } = createBot()

    plugins.foo.on.message('text', async function fooText() {})
    plugins.bar.on.message('text', async function barText() {})
    plugins.bar.on.message('*', async function barGlobal() {})

    bot.on.message('text', async function botText() {})

    const textHandlers = bot.messageHandlers['text']
    expect(textHandlers?.map((h) => h.name)).toEqual(['fooText', 'barText', 'barGlobal', 'botText'])

    const fooTextHandlers = bot.messageHandlers['foo#text']
    expect(fooTextHandlers?.map((h) => h.name)).toEqual(['fooText', 'barGlobal'])

    const barTextHandlers = bot.messageHandlers['bar#text']
    expect(barTextHandlers?.map((h) => h.name)).toEqual(['barText', 'barGlobal'])
  })

  it('should also return plugin handlers when getting event handlers', () => {
    const { bot, plugins } = createBot()

    plugins.foo.on.event('somethingHappend', async function fooSomethingHappend() {})
    plugins.bar.on.event('somethingHappend', async function barSomethingHappend() {})
    plugins.bar.on.event('*', async function barGlobal() {})
    bot.on.event('somethingHappend', async function botSomethingHappend() {})

    const allHandlers = bot.eventHandlers['somethingHappend']
    expect(allHandlers?.map((h) => h.name)).toEqual([
      'fooSomethingHappend',
      'barSomethingHappend',
      'barGlobal',
      'botSomethingHappend',
    ])

    const fooHandlers = bot.eventHandlers['foo#somethingHappend']
    expect(fooHandlers?.map((h) => h.name)).toEqual(['fooSomethingHappend', 'barGlobal'])

    const barHandlers = bot.eventHandlers['bar#somethingHappend']
    expect(barHandlers?.map((h) => h.name)).toEqual(['barSomethingHappend', 'barGlobal'])
  })

  it('should also treat plugin, integration and interface prefix separately when getting event handlers', () => {
    const { bot, plugins } = createBot()

    plugins.foo.on.event('somethingHappend', async function fooSomethingHappend() {})
    plugins.foo.on.event('creatable:itemCreated', async function fooItemCreated() {})
    plugins.foo.on.event('github:prOpened', async function fooPrOpened() {})

    const somethingHappendHandlers = bot.eventHandlers['foo#somethingHappend']
    const itemCreatedHandlers = bot.eventHandlers['creatable:itemCreated']
    const prOpenedHandlers = bot.eventHandlers['github:prOpened']
    expect(somethingHappendHandlers?.map((h) => h.name)).toEqual(['fooSomethingHappend'])
    expect(itemCreatedHandlers?.map((h) => h.name)).toEqual(['fooItemCreated'])
    expect(prOpenedHandlers?.map((h) => h.name)).toEqual(['fooItemCreated', 'fooPrOpened'])
  })

  it('should also return plugin handlers when getting on before_incoming_event hook handlers', () => {
    const { bot, plugins } = createBot()

    plugins.foo.on.beforeIncomingEvent('somethingHappend', async function fooSomethingHappend() {
      return {}
    })
    plugins.bar.on.beforeIncomingEvent('somethingHappend', async function barSomethingHappend() {
      return {}
    })
    plugins.bar.on.beforeIncomingEvent('*', async function barGlobal() {
      return {}
    })
    bot.on.beforeIncomingEvent('somethingHappend', async function botSomethingHappend() {
      return {}
    })

    const allHandlers = bot.hookHandlers.before_incoming_event['somethingHappend']
    expect(allHandlers?.map((h) => h.name)).toEqual([
      'fooSomethingHappend',
      'barSomethingHappend',
      'barGlobal',
      'botSomethingHappend',
    ])

    const fooHandlers = bot.hookHandlers.before_incoming_event['foo#somethingHappend']
    expect(fooHandlers?.map((h) => h.name)).toEqual(['fooSomethingHappend', 'barGlobal'])

    const barHandlers = bot.hookHandlers.before_incoming_event['bar#somethingHappend']
    expect(barHandlers?.map((h) => h.name)).toEqual(['barSomethingHappend', 'barGlobal'])
  })

  it('should also treat plugin, integration and interface prefix separately when getting before incoming event hooks', () => {
    const { bot, plugins } = createBot()

    plugins.foo.on.beforeIncomingEvent('somethingHappend', async function fooSomethingHappend() {
      return {}
    })
    plugins.foo.on.beforeIncomingEvent('creatable:itemCreated', async function fooItemCreated() {
      return {}
    })
    plugins.foo.on.beforeIncomingEvent('github:prOpened', async function fooPrOpened() {
      return {}
    })

    const somethingHappendHandlers = bot.hookHandlers.before_incoming_event['foo#somethingHappend']
    const itemCreatedHandlers = bot.hookHandlers.before_incoming_event['creatable:itemCreated']
    const prOpenedHandlers = bot.hookHandlers.before_incoming_event['github:prOpened']
    expect(somethingHappendHandlers?.map((h) => h.name)).toEqual(['fooSomethingHappend'])
    expect(itemCreatedHandlers?.map((h) => h.name)).toEqual(['fooItemCreated'])
    expect(prOpenedHandlers?.map((h) => h.name)).toEqual(['fooItemCreated', 'fooPrOpened'])
  })

  it('should respect hook handlers register order', () => {
    const { bot, plugins } = createBot()

    plugins.foo.on.beforeIncomingEvent('*', async function handler1() {
      return undefined
    })

    plugins.foo.on.beforeIncomingEvent('creatable:itemCreated', async function handler2() {
      return undefined
    })

    plugins.foo.on.beforeIncomingEvent('github:prOpened', async function handler3() {
      return undefined
    })

    plugins.bar.on.beforeIncomingEvent('*', async function handler4() {
      return undefined
    })

    bot.on.beforeIncomingEvent('*', async function handler5() {
      return undefined
    })

    bot.on.beforeIncomingEvent('github:prOpened', async function handler6() {
      return undefined
    })

    const handlers = bot.hookHandlers.before_incoming_event['github:prOpened']
    expect(handlers?.map((h) => h.name)).toEqual([
      'handler1',
      'handler2',
      'handler3',
      'handler4',
      'handler5',
      'handler6',
    ])
  })
})
