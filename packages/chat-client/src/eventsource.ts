import { isBrowser } from 'browser-or-node'
import type EventSourceBrowser from 'event-source-polyfill'
import type EventSourceNodeJs from 'eventsource'
import type WS from 'ws'
import { EventEmitter } from './event-emitter'

type WebSocketOnOpen = NonNullable<WebSocket['onopen']>
type WebSocketOnMessage = NonNullable<WebSocket['onmessage']>
type WebSocketOnError = NonNullable<WebSocket['onerror']>
type WebSocketOnClose = NonNullable<WebSocket['onclose']>

type WebSocketOpenEvent = Parameters<WebSocketOnOpen>[0]
type WebSocketMessageEvent = Parameters<WebSocketOnMessage>[0]
type WebSocketErrorEvent = Parameters<WebSocketOnError>[0]
type WebSocketCloseEvent = Parameters<WebSocketOnClose>[0]

type WsOnOpen = NonNullable<WS['onopen']>
type WsOnMessage = NonNullable<WS['onmessage']>
type WsOnError = NonNullable<WS['onerror']>
type WsOnClose = NonNullable<WS['onclose']>

type WsOpenEvent = Parameters<WsOnOpen>[0]
type WsMessageEvent = Parameters<WsOnMessage>[0]
type WsErrorEvent = Parameters<WsOnError>[0]
type WsCloseEvent = Parameters<WsOnClose>[0]

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

export type OpenEvent = NodeOpenEvent | BrowserOpenEvent | WebSocketOpenEvent | WsOpenEvent
export type MessageEvent = NodeMessageEvent | BrowserMessageEvent | WebSocketMessageEvent | WsMessageEvent
export type ErrorEvent = NodeErrorEvent | BrowserErrorEvent | WebSocketErrorEvent | WsErrorEvent
export type CloseEvent = WebSocketCloseEvent | WsCloseEvent

export type Events = {
  open: OpenEvent
  message: MessageEvent
  error: ErrorEvent
  close: CloseEvent
}

export type ServerEventsProtocol = 'websocket' | 'sse'

export type Props = {
  headers?: Record<string, string>
  protocol?: ServerEventsProtocol
}

type ServerEventsSource = EventSourceBrowser.EventSourcePolyfill | EventSourceNodeJs | WebSocket | WS

const makeEventSource = (url: string, props: Props = {}) => {
  let source: ServerEventsSource
  const emitter = new EventEmitter<Events>()
  const isWebSocket = props.protocol === 'websocket'
  if (isWebSocket) {
    url = url.replace(/^http/, 'ws')
    if (props.headers?.['x-user-key']) {
      url = `${url}?x-user-key=${encodeURIComponent(props.headers['x-user-key'])}`
    }
    if (isBrowser) {
      source = new WebSocket(url)
    } else {
      const WSModule: typeof WS = require('ws')
      source = new WSModule(url)
    }
    source.onclose = (ev: CloseEvent) => emitter.emit('close', ev)
  } else {
    if (isBrowser) {
      const module: typeof EventSourceBrowser = require('event-source-polyfill')
      source = new module.EventSourcePolyfill(url, { headers: props.headers })
    } else {
      const module: typeof EventSourceNodeJs = require('eventsource')
      source = new module(url, { headers: props.headers })
    }
  }
  source.onopen = (ev: OpenEvent) => emitter.emit('open', ev)
  source.onmessage = (ev: MessageEvent) => emitter.emit('message', ev)
  source.onerror = (ev: ErrorEvent) => emitter.emit('error', ev)
  return {
    emitter,
    source,
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
