import chalk from 'chalk'
import {
  Chat,
  CitationsManager,
  Component,
  DefaultComponents,
  Exit,
  ListenExit,
  Session,
  type ComponentHandler,
  type ExecutionResult,
  type IterationStatus,
  type IterationStatuses,
} from 'llmz'

import { prompt } from './buttons'

export class CLIChat extends Chat {
  private _controller = new AbortController()
  public readonly session = new Session()
  private _buttons: string[] = []

  public turns = 0
  public status?: IterationStatus
  public result?: ExecutionResult
  public citations: CitationsManager = new CitationsManager()

  private _components: Component[] = []

  public constructor(options: { validateText?: (text: string) => Promise<void> } = {}) {
    super({
      components: () => [
        DefaultComponents.Buttons.withHandler((buttons) => {
          this._buttons.push(...buttons.map(({ label }) => label))
        }),
        ...this._components,
      ],
      response: {
        handler: async (text) => {
          await options.validateText?.(text)
          this._sendText(text)
        },
      },
    })
  }

  public onExecutionDone(_result: ExecutionResult): void {
    this.result = _result
    this.status = _result.iterations.at(-1)?.status
  }

  public async iterate() {
    if (this._controller.signal.aborted) {
      return false
    }

    if (this.hasExitedWith(ListenExit)) {
      return this.prompt()
    }

    if (this.turns++ > 100) {
      console.warn(chalk.yellow('⚠️ Too many turns, stopping the chat to prevent infinite loop'))
      return false
    }

    if (!this.result) return true
    if (this.result.isError()) throw this.result.error
    return false
  }

  public hasExited(this: this): this is this & { status: IterationStatuses.ExitSuccess } {
    return this.status?.type === 'exit_success'
  }

  public hasExitedWith<R>(this: this, exit: Exit<R>): this is { status: IterationStatuses.ExitSuccess<R> } & this {
    return this.status?.type === 'exit_success' && this.status.exit_success.exit_name === exit.name
  }

  public prompt = async (msg: string = chalk.gray('(your reply) ')) => {
    const reply = await prompt(msg, this._buttons)
    this._buttons = []
    this.turns = 0

    if (!reply?.trim() || /^(quit|exit)$/i.test(reply.trim())) {
      this.stop()
      return false
    }
    this.session.append({ role: 'user', content: reply })
    console.log(`${chalk.bold('👤 User:')} ${reply}`)
    return true
  }

  private _sendText(text: string) {
    text = text.trim()

    if (!text.length) {
      return
    }

    const sources: string[] = []
    const { cleaned } = this.citations.extractCitations(text, (citation) => {
      const idx = chalk.bgGreenBright.black.bold(` ${sources.length + 1} `)
      sources.push(`${idx}: ${JSON.stringify(citation.source)}`)
      return `${idx}`
    }) ?? { cleaned: text, citations: [] }

    console.log(`${chalk.bold('🤖 Agent:')} ${cleaned}`)

    if (sources.length) {
      console.log(chalk.dim('Citations'))
      console.log(chalk.dim('========='))
      console.log(chalk.dim(sources.join('\n')))
    }
  }

  public registerComponent<T extends Component>(
    component: T,
    render: ComponentHandler<T['definition']['props']>
  ): void {
    if (this._components.some((registered) => registered.definition.name === component.definition.name)) {
      throw new Error(`Component ${component.definition.name} is already registered`)
    }

    this._components.push(component.withHandler(render))
  }

  public stop() {
    this._controller.abort()
  }
}
