import prompts from 'prompts'
import type { Logger } from '../logger'

export type CLIPromptsProps = {
  confirm: boolean
}

export type CLIPromptsChoice<V extends string> = {
  title: string
  value: V
}

export class NonInteractiveError extends Error {
  constructor(message: string) {
    super(`${message}:\n  Cannot prompt for input in non-interactive mode`)
  }
}

export class CLIPrompt {
  constructor(private _props: CLIPromptsProps, private _logger: Logger) {}

  public async confirm(message: string): Promise<boolean> {
    if (this._props.confirm) {
      this._logger.debug(`Confirming automatically: ${message}`)
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

  public async password(message: string, opts?: { initial?: string }): Promise<string | undefined> {
    if (this._props.confirm) {
      throw new NonInteractiveError(message)
    }

    const { prompted } = await this._prompts({
      type: 'password',
      name: 'prompted',
      message,
      initial: opts?.initial,
    })

    return prompted ? prompted : undefined
  }

  public async select<V extends string>(
    message: string,
    opts?: { initial?: CLIPromptsChoice<V>; choices: CLIPromptsChoice<V>[] }
  ): Promise<V | undefined> {
    if (this._props.confirm) {
      throw new NonInteractiveError(message)
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

  public async text(message: string, opts?: { initial?: string }): Promise<string | undefined> {
    if (this._props.confirm) {
      throw new NonInteractiveError(message)
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
