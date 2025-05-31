import chalk from 'chalk'
import {
  Component,
  DefaultComponents,
  Exit,
  ObjectInstance,
  Tool,
  executeContext,
  isComponent,
  messageTool,
  type RenderedComponent,
  type Iteration,
} from 'llmz'

import { prompt } from './buttons'
import type { IterationStatuses } from '../../dist/context'
import { loading } from './spinner'

type TranscriptItem = {
  role: 'assistant' | 'user'
  content: string
  name?: string
}

export type ChatProps = Parameters<typeof executeContext>[0] & {
  renderMessage?: (message: RenderedComponent) => void
}

const doOrGetValue = async <T>(value: T | ((...args: any) => T) | ((...args: any) => Promise<T>)): Promise<T> => {
  if (typeof value === 'function') {
    return await (value as Function)()
  }

  return value
}

export class CLIChat {
  private _controller = new AbortController()
  private _transcript: TranscriptItem[] = []
  private _buttons: string[] = []

  public constructor(public props: ChatProps) {}

  public turns = 0
  public done = false
  public status?: Iteration['status']

  public hasExited(this: this): this is this & { status: IterationStatuses.ExitSuccess } {
    return this.status?.type === 'exit_success'
  }

  public hasExitedWith<R>(this: this, exit: Exit<R>): this is { status: IterationStatuses.ExitSuccess<R> } & this {
    return this.status?.type === 'exit_success' && this.status.exit_success.exit_name === exit.name
  }

  public get context(): ChatProps {
    if (this.turns++ > 100) {
      this.done = true
      throw new Error('Too many turns, stopping the chat to prevent infinite loop')
    }

    return {
      client: this.props.client,
      onIterationEnd: (iteration: Iteration) => {
        this.status = iteration.status
        if (typeof this.props.onIterationEnd === 'function') {
          return this.props.onIterationEnd(iteration)
        }
      },
      onBeforeExecution: (iteration: Iteration) => {
        if (typeof this.props.onBeforeExecution === 'function') {
          return this.props.onBeforeExecution(iteration)
        }
      },
      onTrace: (event) => {
        if (event.trace.type === 'llm_call_started') {
          loading(true, chalk.dim('💭 Generating ...'))
        } else if (event.trace.type === 'llm_call_success') {
          loading(false)
        }

        this.props.onTrace?.(event)
      },
      options: this.props.options,
      snapshot: this.props.snapshot,
      signal: this.props.signal || this._controller.signal,
      transcript: async () => (this.props.transcript ? doOrGetValue(this.props.transcript) : this._transcript),
      tools: this._getTools,
      objects: async () => (this.props.objects ? ((await doOrGetValue(this.props.objects)) as ObjectInstance[]) : []),
      components: async () =>
        this.props.components
          ? ((await doOrGetValue(this.props.components)) as Component[])
          : [DefaultComponents.Text, DefaultComponents.Button],
      instructions: this.props.instructions,
      exits: this.props.exits,
      onExit: async (exit, value) => {
        if (typeof this.props.onExit === 'function') {
          await this.props.onExit(exit, value)
        }

        if (exit.name === 'listen') {
          await this.prompt()
        } else {
          this.done = true
        }
      },
    }
  }

  public prompt = async (msg: string = chalk.gray('(your reply) ')) => {
    const reply = await prompt(msg, this._buttons)
    this._buttons = []
    this.turns = 0

    if (reply?.trim().length) {
      this._transcript.push({ role: 'user', content: reply })
      console.log(`${chalk.bold('👤 User:')} ${reply}`)
    } else {
      this._transcript.push({ role: 'user', content: '[silence] (user did not answer)' })
    }
  }

  private _getTools = async (): Promise<Tool[]> => {
    const tools = await doOrGetValue(this.props.tools || [])

    const message = messageTool(async (input) => {
      let text = ''

      let children: any[] = [input]
      if (isComponent(input, DefaultComponents.Text)) {
        children = input.children
      }

      for (const child of children) {
        if (isComponent(child, DefaultComponents.Button) && child.props?.label) {
          this._buttons.push(child.props.label)
        } else if (
          typeof child === 'string' ||
          typeof child === 'number' ||
          typeof child === 'boolean' ||
          typeof child === 'bigint'
        ) {
          text += '\n' + child
        } else {
          this._transcript.push({
            role: 'assistant',
            content: JSON.stringify(child, null, 2),
          })

          if (this.props.renderMessage) {
            this.props.renderMessage(child as RenderedComponent)
          } else {
            console.log(chalk.bold('🤖 Agent: ') + chalk.gray('<unknown component> ' + JSON.stringify(child)))
          }
        }
      }

      text = text.trim()
      if (text.length > 0) {
        const buttonsStr = this._buttons.length > 0 ? `\n\n${chalk.bold('Buttons:')} ${this._buttons.join(', ')}` : ''
        this._transcript.push({ role: 'assistant', content: text + buttonsStr })
        console.log(`${chalk.bold('🤖 Agent:')} ${text}`)
      }
    })

    return [...tools, message]
  }

  public stop = () => {
    this.done = true
    this._controller?.abort('User stopped the chat')
  }
}
