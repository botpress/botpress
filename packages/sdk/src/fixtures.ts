import { DefaultBot } from './bot/common/generic'
import { DefaultChannel, DefaultIntegration } from './integration/common/generic'
import { DefaultPlugin } from './plugin/common/generic'

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

type _TotoTutuTataInterface = {
  actions: {
    doToto: {
      input: {
        inputToto: string
      }
      output: {
        outputToto: string
      }
    }
    doTutu: {
      input: {
        inputTutu: number
      }
      output: {
        outputTutu: number
      }
    }
    doTata: {
      input: {
        inputTata: boolean
      }
      output: {
        outputTata: boolean
      }
    }
  }
  events: {
    onToto: {
      eventToto: string
    }
    onTutu: {
      eventTutu: number
    }
    onTata: {
      eventTata: boolean
    }
  }
}

export type FooBarBazIntegration = DefaultIntegration<_FooBarBazIntegration>

export type TotoTutuTataIntegration = DefaultIntegration<_TotoTutuTataInterface>

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
  states: {
    currentUser: { name: string; age: number }
  }
}>

export type FooBarBazPlugin = DefaultPlugin<{
  integrations: {
    fooBarBaz: _FooBarBazIntegration
  }
  interfaces: {
    totoTutuTata: _TotoTutuTataInterface
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

export type EmptyPlugin = DefaultPlugin<{
  integrations: {}
  actions: {}
  events: {}
}>
