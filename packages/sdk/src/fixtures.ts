import { DefaultBot } from './bot/types/generic'
import { DefaultChannel, DefaultIntegration } from './integration/types/generic'

type _FooBarBazIntegration = {
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
}

export type FooBarBazIntegration = DefaultIntegration<_FooBarBazIntegration>

export type FooBarBazBot = DefaultBot<{
  integrations: {
    fooBarBaz: _FooBarBazIntegration
  }
  actions: {
    act: {
      input: {
        arguments: Record<string, unknown>
      }
      output: {
        result: unknown
      }
    }
  }
}>

export type EmptyBot = DefaultBot<{
  integrations: {}
  events: {}
  states: {}
  actions: {}
}>
