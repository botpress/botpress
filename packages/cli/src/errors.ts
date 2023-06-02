import { isApiError, ApiError, UnknownError } from '@botpress/client'
import axios, { AxiosError } from 'axios'
import { VError } from 'verror'
import * as consts from './consts'

type KnownApiError = Exclude<ApiError, UnknownError>
const isKnownApiError = (e: unknown): e is KnownApiError => isApiError(e) && !(e instanceof UnknownError)

export class BotpressCLIError extends VError {
  public static wrap(thrown: unknown, message: string): BotpressCLIError {
    const err = BotpressCLIError.map(thrown)
    return new BotpressCLIError(err, message ?? '')
  }

  public static map(thrown: unknown): BotpressCLIError {
    if (thrown instanceof BotpressCLIError) {
      return thrown
    }
    if (thrown instanceof UnknownError) {
      const inst = new HTTPError(500, 'An unknown error has occurred.')
      inst.debug = thrown.message
      return inst
    }
    if (isKnownApiError(thrown)) {
      return HTTPError.fromApi(thrown)
    }
    if (axios.isAxiosError(thrown)) {
      return HTTPError.fromAxios(thrown)
    }
    if (thrown instanceof Error) {
      const { message } = thrown
      return new BotpressCLIError(message)
    }
    return new BotpressCLIError(`${thrown}`)
  }

  private readonly _debug: string[]

  constructor(error: BotpressCLIError, message: string)
  constructor(message: string)
  public constructor(first: BotpressCLIError | string, second?: string) {
    if (typeof first === 'string') {
      super(first)
      this._debug = []
      return
    }
    super(first, second!)
    this._debug = [...first._debug]
  }

  public set debug(msg: string) {
    this._debug.push(msg)
  }

  public get debug(): string {
    const dbgMsgs = this._debug.filter((s) => s.length)
    if (!dbgMsgs.length) {
      return ''
    }
    return 'Error: \n' + dbgMsgs.map((s) => `  ${s}`).join('\n')
  }
}

export class ExclusiveBotFeatureError extends BotpressCLIError {
  constructor() {
    const message = 'This feature is only available for bots. This project is an integration'
    super(message)
  }
}

export class ExclusiveIntegrationFeatureError extends BotpressCLIError {
  constructor() {
    const message = 'This feature is only available for integration. This project is a bot'
    super(message)
  }
}

export class HTTPError extends BotpressCLIError {
  constructor(public readonly status: number | undefined, message: string) {
    super(message)
  }

  public static fromAxios(e: AxiosError<{ message?: string }>): HTTPError {
    const message = this._axiosMsg(e)
    return new HTTPError(e.response?.status, message)
  }

  public static fromApi(e: KnownApiError): HTTPError {
    const { message, code } = e
    return new HTTPError(code, message)
  }

  private static _axiosMsg(e: AxiosError<{ message?: string }>): string {
    let message = e.message
    if (e.response?.statusText) {
      message += `\n  ${e.response?.statusText}`
    }
    if (e.response?.status && e.request?.method && e.request?.path) {
      message += `\n  (${e.response?.status}) ${e.request.method} ${e.request.path}`
    }
    if (e.response?.data?.message) {
      message += `\n  ${e.response?.data?.message}`
    }
    return message
  }
}

export class NoBundleFoundError extends BotpressCLIError {
  constructor() {
    const message = 'No bundle found. Please run `bp bundle` first.'
    super(message)
  }
}

export class NoBotsFoundError extends BotpressCLIError {
  constructor() {
    const message = `No Bot found in your Workspace. Please create one first at ${consts.defaultBotpressApp}.`
    super(message)
  }
}

export class NoWorkspacesFoundError extends BotpressCLIError {
  constructor() {
    const message = 'No Workspace found. Please create one first.'
    super(message)
  }
}

export class NotLoggedInError extends BotpressCLIError {
  constructor() {
    const message = 'Not logged in. Please run `bp login` first.'
    super(message)
  }
}

export class ParamRequiredError extends BotpressCLIError {
  constructor(param: string) {
    const message = `${param} is required.`
    super(message)
  }
}

export class InvalidIntegrationReferenceError extends BotpressCLIError {
  constructor(ref: string) {
    const message = `Invalid integration reference "${ref}".`
    super(message)
  }
}
