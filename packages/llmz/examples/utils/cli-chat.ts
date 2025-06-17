import chalk from 'chalk'
import {
  Chat,
  CitationsManager,
  Component,
  DefaultComponents,
  Exit,
  ListenExit,
  isComponent,
  type ExecutionResult,
  type IterationStatus,
  type IterationStatuses,
  type RenderedComponent,
} from 'llmz'

import { prompt } from './buttons'

type TranscriptItem = {
  role: 'assistant' | 'user'
  content: string
  name?: string
}

export class CLIChat extends Chat {
  private _controller = new AbortController()
  public transcript: TranscriptItem[] = []
  private _buttons: string[] = []

  public turns = 0
  public status?: IterationStatus
  public result?: ExecutionResult
  public citations: CitationsManager = new CitationsManager()

  public renderers: Array<{
    component: Component
    render: (component: RenderedComponent) => Promise<void>
  }> = []

  public constructor() {
    super({
      components: () => [DefaultComponents.Text, DefaultComponents.Button, ...this.renderers.map((r) => r.component)],
      transcript: () => this.transcript,
      handler: (input) => this.sendMessage(input),
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
      await this.prompt()
      return true
    }

    if (this.turns++ > 100) {
      console.warn(chalk.yellow('⚠️ Too many turns, stopping the chat to prevent infinite loop'))
      return false
    }

    if (!this.result) {
      return true
    }

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

    if (reply?.trim().length) {
      this.transcript.push({ role: 'user', content: reply })
      console.log(`${chalk.bold('👤 User:')} ${reply}`)
    } else {
      this.transcript.push({ role: 'user', content: '[silence] (user did not answer)' })
    }
  }

  private async sendMessage(input: RenderedComponent) {
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
        this.transcript.push({
          role: 'assistant',
          content: JSON.stringify(child, null, 2),
        })

        const renderer = this.renderers.find((r) => isComponent(child, r.component))

        if (renderer) {
          await renderer.render(child)
        } else {
          console.log(chalk.bold('🤖 Agent: ') + chalk.gray('<unknown component> ' + JSON.stringify(child)))
        }
      }
    }

    text = text.trim()
    if (text.length > 0) {
      let sources: string[] = []
      const { cleaned } = this.citations.extractCitations(text, (citation) => {
        let idx = chalk.bgGreenBright.black.bold(` ${sources.length + 1} `)
        sources.push(`${idx}: ${JSON.stringify(citation.source)}`)
        return `${idx}`
      }) ?? { cleaned: text, citations: [] }
      const buttonsStr = this._buttons.length > 0 ? `\n\n${chalk.bold('Buttons:')} ${this._buttons.join(', ')}` : ''
      this.transcript.push({ role: 'assistant', content: cleaned + buttonsStr })
      console.log(`${chalk.bold('🤖 Agent:')} ${cleaned}`)
      if (sources.length) {
        console.log(chalk.dim('Citations'))
        console.log(chalk.dim('========='))
        console.log(chalk.dim(sources.join('\n')))
      }
    }
  }

  public registerComponent<
    T extends Component,
    Props extends Record<string, any> = T extends Component ? T['propsType'] : never,
  >(component: T, render: (component: RenderedComponent<Props>) => Promise<void>): void {
    if (this.renderers.some((r) => r.component.definition.name === component.definition.name)) {
      throw new Error(`Component ${component.definition.name} is already registered`)
    }
    this.renderers.push({ component, render: render as any })
  }

  public stop() {
    this._controller.abort()
  }
}
