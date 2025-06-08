import { Component, RenderedComponent } from './component.js'
import { Context } from './context.js'
import { ValueOrGetter } from './getter.js'
import { ExecutionResult } from './result.js'
import { TranscriptArray, TranscriptMessage } from './transcript.js'

export type MessageHandler = (input: RenderedComponent) => Promise<void> | void

export class Chat {
  public readonly handler: MessageHandler
  public readonly transcript: ValueOrGetter<TranscriptArray, Context>
  public readonly components: ValueOrGetter<Component[], Context>

  public constructor(props: {
    handler: MessageHandler
    components: ValueOrGetter<Component[], Context>
    transcript?: ValueOrGetter<TranscriptMessage[], Context>
  }) {
    this.handler = props.handler
    this.components = props.components
    this.transcript = props.transcript || []
  }

  public onExecutionDone(_result: ExecutionResult): void {
    // This method can be overridden to handle execution completion
  }
}
