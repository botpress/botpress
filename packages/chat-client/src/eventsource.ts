import { isBrowser } from 'browser-or-node'
import type EventSourceBrowser from 'event-source-polyfill'
import type EventSourceNodeJs from 'eventsource'
import { EventEmitter } from './event-emitter'

type NodeOnOpen = EventSourceNodeJs['onopen']
type NodeOnMessage = EventSourceNodeJs['onmessage']
type NodeOnError = EventSourceNodeJs['onerror']

type NodeOpenEvent = Parameters<NodeOnOpen>[0]
type NodeMessageEvent = Parameters<NodeOnMessage>[0]
type NodeErrorEvent = Parameters<NodeOnError>[0]

type BrowserOnOpen = NonNullable<EventSourceBrowser.EventSourcePolyfill['onopen']>
type BrowserOnMessage = NonNullable<EventSourceBrowser.EventSourcePolyfill['onmessage']>
type BrowserOnError = NonNullable<EventSourceBrowser.EventSourcePolyfill['onerror']>

type BrowserOpenEvent = Parameters<BrowserOnOpen>[0]
type BrowserMessageEvent = Parameters<BrowserOnMessage>[0]
type BrowserErrorEvent = Parameters<BrowserOnError>[0]

export type OpenEvent = NodeOpenEvent | BrowserOpenEvent
export type MessageEvent = NodeMessageEvent | BrowserMessageEvent
export type ErrorEvent = NodeErrorEvent | BrowserErrorEvent

export type Events = {
  open: OpenEvent
  message: MessageEvent
  error: ErrorEvent
}

export type Props = {
  headers?: Record<string, string>
}

const makeEventSource = (url: string, props: Props = {}) => {
  if (isBrowser) {
    const module: typeof EventSourceBrowser = require('event-source-polyfill')
    const ctor = module.EventSourcePolyfill
    const source = new ctor(url, { headers: props.headers })
    const emitter = new EventEmitter<Events>()
    source.onopen = (ev) => emitter.emit('open', ev)
    source.onmessage = (ev) => emitter.emit('message', ev)
    source.onerror = (ev) => emitter.emit('error', ev)
    return {
      emitter,
      source,
    }
  } else {
    const module: typeof EventSourceNodeJs = require('eventsource')
    const source = new module(url, { headers: props.headers })
    const emitter = new EventEmitter<Events>()
    source.onopen = (ev) => emitter.emit('open', ev)
    source.onmessage = (ev) => emitter.emit('message', ev)
    source.onerror = (ev) => emitter.emit('error', ev)
    return {
      emitter,
      source,
    }
  }
}

export type EventSourceEmitter = {
  on: EventEmitter<Events>['on']
  close: () => void
}

export const listenEventSource = async (url: string, props: Props = {}): Promise<EventSourceEmitter> => {
  const { emitter, source } = makeEventSource(url, props)

  await new Promise<void>((resolve, reject) => {
    emitter.on('open', () => {
      resolve()
    })
    emitter.on('error', (thrown) => {
      reject(thrown)
    })
  }).finally(() => emitter.cleanup())

  return {
    on: emitter.on.bind(emitter),
    close: () => {
      emitter.cleanup()
      source.close()
    },
  }
}
