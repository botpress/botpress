import { DefaultBot } from './bot/types/generic'
import { DefaultChannel, DefaultIntegration } from './integration/types/generic'

export type FooBarBazIntegration = DefaultIntegration<{
  actions: {
    doFoo: {
      input: {
        inputFoo: string
      }
      output: {
        outputFoo: string
      }
    }
    doBar: {
      input: {
        inputBar: number
      }
      output: {
        outputBar: number
      }
    }
    doBaz: {
      input: {
        inputBaz: boolean
      }
      output: {
        outputBaz: boolean
      }
    }
  }
  events: {
    onFoo: {
      eventFoo: string
    }
    onBar: {
      eventBar: number
    }
    onBaz: {
      eventBaz: boolean
    }
  }
  channels: {
    channelFoo: DefaultChannel<{
      messages: {
        messageFoo: {
          foo: string
        }
      }
    }>
    channelBar: DefaultChannel<{
      messages: {
        messageBar: {
          bar: number
        }
      }
    }>
    channelBaz: DefaultChannel<{
      messages: {
        messageBaz: {
          baz: boolean
        }
      }
    }>
  }
}>

export type FooBarBazBot = DefaultBot<{
  integrations: {
    fooBarBaz: FooBarBazIntegration
  }
}>

export type EmptyBot = DefaultBot<{
  integrations: {}
  events: {}
  states: {}
  actions: {}
}>
