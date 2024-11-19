import { MakeBot } from './bot/types/generic'
import { MakeChannel, MakeIntegration } from './integration/types/generic'

export type FooBarBazIntegration = MakeIntegration<{
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
    channelFoo: MakeChannel<{
      messages: {
        messageFoo: {
          foo: string
        }
      }
    }>
    channelBar: MakeChannel<{
      messages: {
        messageBar: {
          bar: number
        }
      }
    }>
    channelBaz: MakeChannel<{
      messages: {
        messageBaz: {
          baz: boolean
        }
      }
    }>
  }
}>

export type FooBarBazBot = MakeBot<{
  integrations: {
    fooBarBaz: FooBarBazIntegration
  }
}>

export type EmptyBot = MakeBot<{
  integrations: {}
  events: {}
  states: {}
  actions: {}
}>
