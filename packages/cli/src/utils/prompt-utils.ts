import prompts from 'prompts'
import type { Logger } from '../logger'

export type CLIPromptsProps = {
  confirm: boolean
}

type ChoiceValueType = string | number

export type CLIPromptsChoice<V extends ChoiceValueType> = {
  title: string
  value: V
}

type PasswordOptions = Partial<{
  default: string | undefined
  initial: string
}>
type SelectOptions<V extends ChoiceValueType> = Partial<{
  default: V | undefined
  initial: CLIPromptsChoice<V>
  choices: CLIPromptsChoice<V>[]
}>
type TextOptions = Partial<{
  default: string | undefined
  initial: string
}>

export class CLIPrompt {
  public constructor(
    private _props: CLIPromptsProps,
    private _logger: Logger
  ) {}

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

  public async select<V extends ChoiceValueType = string>(
    message: string,
    opts: SelectOptions<V> = {}
  ): Promise<V | undefined> {
    if (this._props.confirm) {
      this._logger.debug(`Return default (non-interactive mode): ${message}`)
      return opts?.default
    }

    // NOTE: whilst Prompts supports string, number, date and boolean values for
    //       choices, it behaves unexpectedly when the value is a number and is
    //       equal to 0. To work around this, we convert the value to a symbol
    //       if it is 0, and then convert it back to a number if it was 0.

    const isNumber = typeof opts?.choices?.[0]?.value === 'number'
    const transformedChoices = isNumber
      ? opts?.choices?.map((c) => ({ ...c, value: c.value === 0 ? Symbol.for('0') : c.value }))
      : opts?.choices

    const { prompted } = await this._prompts({
      type: 'autocomplete',
      name: 'prompted',
      message,
      initial: opts?.initial?.value,
      choices: transformedChoices as prompts.PromptObject['choices'],
    })

    return prompted !== undefined ? (isNumber && prompted === Symbol.for('0') ? 0 : prompted) : undefined
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
