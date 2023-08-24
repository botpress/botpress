import prompts from 'prompts'
import type { Logger } from '../logger'

export type CLIPromptsProps = {
  confirm: boolean
}

export type CLIPromptsChoice<V extends string> = {
  title: string
  value: V
}

type PasswordOptions = Partial<{
  default: string | undefined
  initial: string
}>
type SelectOptions<V extends string> = Partial<{
  default: V | undefined
  initial: CLIPromptsChoice<V>
  choices: CLIPromptsChoice<V>[]
}>
type TextOptions = Partial<{
  default: string | undefined
  initial: string
}>

export class CLIPrompt {
  constructor(private _props: CLIPromptsProps, private _logger: Logger) {}

  public async confirm(message: string): Promise<boolean> {
    if (this._props.confirm) {
      this._logger.debug(`Confirming automatically (non-interactive mode): ${message}`)
      return true
    }

    const { confirm } = await this._prompts({
      type: 'confirm',
      name: 'confirm',
      message,
      initial: false,
    })

    if (!confirm) {
      return false
    }
    return true
  }

  public async password(message: string, opts: PasswordOptions = {}): Promise<string | undefined> {
    if (this._props.confirm) {
      this._logger.debug(`Return default (non-interactive mode): ${message}`)
      return opts?.default
    }

    const { prompted } = await this._prompts({
      type: 'password',
      name: 'prompted',
      message,
      initial: opts?.initial,
    })

    return prompted ? prompted : undefined
  }

  public async select<V extends string>(message: string, opts: SelectOptions<V> = {}): Promise<V | undefined> {
    if (this._props.confirm) {
      this._logger.debug(`Return default (non-interactive mode): ${message}`)
      return opts?.default
    }

    const { prompted } = await this._prompts({
      type: 'autocomplete',
      name: 'prompted',
      message,
      initial: opts?.initial?.value,
      choices: opts?.choices,
    })
    return prompted ? prompted : undefined
  }

  public async text(message: string, opts: TextOptions = {}): Promise<string | undefined> {
    if (this._props.confirm) {
      this._logger.debug(`Return default (non-interactive mode): ${message}`)
      return opts?.default
    }

    const { prompted } = await this._prompts({
      type: 'text',
      name: 'prompted',
      message,
      initial: opts?.initial,
    })

    return prompted ? prompted : undefined
  }

  private _prompts = (...args: Parameters<typeof prompts>): ReturnType<typeof prompts> => {
    this._logger.cleanup()
    return prompts(...args)
  }
}
