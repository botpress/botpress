import { parse } from 'acorn'
import type { Component } from './component.js'
import type { Exit } from './exit.js'

export type ExampleMessage = {
  component: Component | string
  props?: Record<string, unknown>
  body?: string
}

type ExampleResponse = {
  messages?: ExampleMessage[]
  code?: string
  exit?: Exit | string
  props?: unknown
}

/** One hypothetical situation and one native assistant response. */
export type ExampleDefinition = {
  situation: string
  reason?: string
} & ExampleResponse

function validateName(value: unknown, kind: string): void {
  if (typeof value !== 'string' || !/^[a-z][a-z0-9_]{0,49}$/i.test(value)) {
    throw new Error(`Invalid example ${kind} name: ${String(value)}`)
  }
}

function cloneJSON<T>(value: T): T {
  const text = JSON.stringify(value, (_key, item) => {
    if (typeof item === 'function' || typeof item === 'symbol' || typeof item === 'bigint') {
      throw new Error('Example values must be JSON serializable.')
    }

    if (typeof item === 'number' && !Number.isFinite(item)) {
      throw new Error('Example values must contain finite numbers.')
    }

    return item
  })

  if (text === undefined) {
    throw new Error('Example values must be JSON serializable.')
  }

  return JSON.parse(text) as T
}

function copyMessage(message: ExampleMessage): ExampleMessage {
  if (!message || typeof message !== 'object' || Array.isArray(message)) {
    throw new Error('An example message must be an object.')
  }

  const name = typeof message.component === 'string' ? message.component : message.component?.definition.name
  validateName(name, 'component')

  if (message.body !== undefined && typeof message.body !== 'string') {
    throw new Error('An example message body must be a string.')
  }

  if (
    message.props !== undefined &&
    (!message.props || typeof message.props !== 'object' || Array.isArray(message.props))
  ) {
    throw new Error('Example component props must be a JSON object.')
  }

  return {
    component: message.component,
    ...(message.props === undefined ? {} : { props: cloneJSON(message.props) }),
    ...(message.body === undefined ? {} : { body: message.body }),
  }
}

/**
 * A structured demonstration, rendered by the native prompt as hypothetical
 * assistant text and tool calls. Examples are validated but never executed.
 */
export class Example {
  public readonly definition: ExampleDefinition
  public readonly situation: string
  public readonly reason?: string

  public constructor(definition: ExampleDefinition) {
    if (!definition || typeof definition.situation !== 'string' || !definition.situation.trim()) {
      throw new Error('An example requires a non-empty situation.')
    }

    if (definition.reason !== undefined && typeof definition.reason !== 'string') {
      throw new Error('An example reason must be a string.')
    }

    if ('result' in definition || 'iterations' in definition || 'steps' in definition) {
      throw new Error('An example demonstrates one response, not tool results or multiple iterations.')
    }

    if (definition.messages !== undefined && !Array.isArray(definition.messages)) {
      throw new Error('Example messages must be an array.')
    }

    const messages = definition.messages?.map(copyMessage)

    if (definition.code !== undefined) {
      if (typeof definition.code !== 'string' || !definition.code.trim()) {
        throw new Error('Example code must not be empty.')
      }

      parse(definition.code, {
        ecmaVersion: 'latest',
        allowAwaitOutsideFunction: true,
        allowReturnOutsideFunction: true,
      })
    }

    if (definition.exit !== undefined) {
      const exitName = typeof definition.exit === 'string' ? definition.exit : definition.exit?.name
      validateName(exitName, 'exit')
    }

    if (definition.code === undefined && definition.exit === undefined && !messages?.length) {
      throw new Error('An example requires messages, code, or an exit.')
    }

    this.situation = definition.situation
    this.reason = definition.reason
    this.definition = {
      ...definition,
      ...(messages === undefined ? {} : { messages }),
      ...(definition.props === undefined ? {} : { props: cloneJSON(definition.props) }),
    } as ExampleDefinition
  }
}
