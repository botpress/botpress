import * as client from '@botpress/client'
import axios, { AxiosError } from 'axios'
import { VError } from 'verror'
import * as consts from './consts'

type KnownApiError = Exclude<client.ApiError, client.UnknownError>
const isKnownApiError = (e: unknown): e is KnownApiError => client.isApiError(e) && !(e instanceof client.UnknownError)

export class BotpressCLIError extends VError {
  public static wrap(thrown: unknown, message: string): BotpressCLIError {
    const err = BotpressCLIError.map(thrown)
    return new BotpressCLIError(err, message ?? '')
  }

  public static map(thrown: unknown): BotpressCLIError {
    if (thrown instanceof BotpressCLIError) {
      return thrown
    }
    if (thrown instanceof client.UnknownError) {
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

  public constructor(error: BotpressCLIError, message: string)
  public constructor(message: string)
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
  public constructor() {
    const message = 'This feature is only available for bots. This project is an integration or interface.'
    super(message)
  }
}

export class ExclusiveIntegrationFeatureError extends BotpressCLIError {
  public constructor() {
    const message = 'This feature is only available for integration. This project is a bot or interface.'
    super(message)
  }
}

export class HTTPError extends BotpressCLIError {
  public constructor(
    public readonly status: number | undefined,
    message: string
  ) {
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
  public constructor() {
    const message = 'No bundle found. Please run `bp bundle` first.'
    super(message)
  }
}

export class NoBotsFoundError extends BotpressCLIError {
  public constructor() {
    const message = `No Bot found in your Workspace. Please create one first at ${consts.defaultBotpressAppUrl}.`
    super(message)
  }
}

export class NoWorkspacesFoundError extends BotpressCLIError {
  public constructor() {
    const message = 'No Workspace found. Please create one first.'
    super(message)
  }
}

export class NotLoggedInError extends BotpressCLIError {
  public constructor() {
    const message = 'Not logged in. Please run `bp login` first.'
    super(message)
  }
}

export class ParamRequiredError extends BotpressCLIError {
  public constructor(param: string) {
    const message = `${param} is required.`
    super(message)
  }
}

export class InvalidPackageReferenceError extends BotpressCLIError {
  public constructor(ref: string) {
    const message = `Invalid package reference "${ref}".`
    super(message)
  }
}

export class UnsupportedProjectType extends BotpressCLIError {
  public constructor() {
    const message = 'Unsupported project type.'
    super(message)
  }
}

export class ProjectDefinitionNotFoundError extends BotpressCLIError {
  public constructor(workdir: string) {
    const message = `No project definition found at "${workdir}".`
    super(message)
  }
}
