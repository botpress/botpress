import type { Context } from '../context.js'
import { InvalidConfigurationError } from '../errors.js'
import type { ValueOrGetter } from '../getter.js'
import type { ExecutionResult } from '../result.js'
import type { Component, RenderedComponent } from './component.js'
import type { Response } from './response.js'

/** Ordinary assistant output, independent of the configured response style. */
export type AssistantTextMessage = { type: 'text'; text: string }

/** Text uses native assistant output; registered components provide rich UI. */
export type ChatMessage = AssistantTextMessage | RenderedComponent

export type MessageMetadata = {
  /** The iteration that owns this response or component send. */
  iterationId: string
  /** Logical send ID, shared with its streamed text deltas. */
  id: string
}

/** Receives the complete committed assistant response. */
export type ResponseHandler = (text: string, metadata: MessageMetadata) => Promise<void> | void

export type MessageDelta =
  | {
      restart: false
      type: 'text'
      iterationId: string
      id: string
      /** New text since the preceding delta. */
      delta: string
      /** Complete provisional text received so far. */
      content: string
    }
  | {
      /** Retract provisional text for this iteration before any replacement. */
      restart: true
      iterationId: string
      attempt: number
      fromModel: string
      toModel: string
      reason: string
    }

/** Preview failures are ignored; failed retractions stop generation. */
export type MessageDeltaHandler = (delta: MessageDelta) => Promise<void> | void

/**
 * Connects native assistant replies and rich components to the host application.
 *
 * `response` controls how all assistant text is written. It does not create a
 * JavaScript method or synthesize audio. `components` registers only rich UI
 * methods such as chat.buttons or chat.image.
 *
 * Streamed deltas are provisional. After successful generation, the response
 * handler receives the complete text with the same message ID. Each component
 * owns its delivery handler. Without response callbacks, text remains available
 * in the native session history.
 */
export class Chat {
  public readonly components: ValueOrGetter<Component[], Context>
  public readonly response: ValueOrGetter<Response, Context>

  public constructor(
    props: {
      components?: ValueOrGetter<Component[], Context>
      /** Resolved once per iteration; defaults to Markdown. */
      response?: ValueOrGetter<Response, Context>
    } = {}
  ) {
    if (!props || typeof props !== 'object' || Array.isArray(props)) {
      throw new InvalidConfigurationError('Chat configuration must be an object.')
    }

    if ('handler' in props || 'onMessageDelta' in props) {
      throw new InvalidConfigurationError(
        'Use response.handler and response.onDelta for text, and component handlers for rich messages.'
      )
    }

    const unknown = Object.keys(props).find((key) => !['components', 'response'].includes(key))

    if (unknown) {
      throw new InvalidConfigurationError(`Unknown Chat option: ${unknown}.`)
    }

    this.components = props.components ?? []
    this.response = props.response === undefined ? 'markdown' : props.response
  }

  /** Called after an execution completes or fails. */
  public onExecutionDone(_result: ExecutionResult): void {
    // Host subclasses can react to the completed execution.
  }
}
