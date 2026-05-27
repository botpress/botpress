import * as client from '@botpress/client'
import axios, { AxiosError } from 'axios'
import { VError } from 'verror'
import * as consts from './consts'

type KnownApiError = Exclude<client.ApiError, client.UnknownError>
const isUnknownApiError = (e: unknown): e is client.UnknownError => client.isApiError(e) && e.type === 'Unknown'
const isKnownApiError = (e: unknown): e is KnownApiError => client.isApiError(e) && e.type !== 'Unknown'

export class BotpressCLIError extends VError {
  public static wrap(thrown: unknown, message: string): BotpressCLIError {
    const err = BotpressCLIError.map(thrown)
    if (!err.message.trim()) {
      // the cause carries no message of its own; avoid rendering a dangling "<message>: "
      // while still keeping it as a cause so fullStack can surface the deeper chain under --verbose
      return new BotpressCLIError(message ?? '', { cause: err })
    }
    return new BotpressCLIError(err, message ?? '')
  }

  public static map(thrown: unknown): BotpressCLIError {
    if (thrown instanceof BotpressCLIError) {
      return thrown
    }
    if (isUnknownApiError(thrown)) {
      const cause = thrown.error?.cause
      if (cause && typeof cause === 'object' && 'code' in cause && cause.code === 'ECONNREFUSED') {
        return new HTTPError(500, 'The connection was refused by the server')
      }

      const unknownMessage = 'An unknown API error occurred'
      const actualTrimmedMessage = thrown.message.trim()
      if (!actualTrimmedMessage) {
        return new HTTPError(500, unknownMessage)
      }

      const inner = new HTTPError(500, actualTrimmedMessage)
      return new BotpressCLIError(inner, unknownMessage)
    }
    if (isKnownApiError(thrown)) {
      return HTTPError.fromApi(thrown)
    }
    if (axios.isAxiosError(thrown)) {
      return HTTPError.fromAxios(thrown)
    }
    if (thrown instanceof Error) {
      return new BotpressCLIError(thrown.message, { cause: thrown })
    }
    return new BotpressCLIError(String(thrown))
  }

  public constructor(error: BotpressCLIError, message: string)
  public constructor(message: string)
  public constructor(message: string, opts: { cause?: Error })
  public constructor(first: BotpressCLIError | string, second?: string | { cause?: Error }) {
    if (typeof first === 'string') {
      if (typeof second === 'object') {
        // preserve the original error as a cause without duplicating its message into ours.
        // `skipCauseMessage` is supported by verror at runtime (validated against verror@1.10.1)
        // but missing from @types/verror, so the option object is typed inline rather than as
        // VError.Options. The message-neutrality this relies on is guarded by errors.test.ts.
        super({ cause: second.cause, skipCauseMessage: true } as { cause?: Error; skipCauseMessage: boolean }, first)
        return
      }
      super(first)
      return
    }
    super(first, second as string)
  }

  // VError.fullStack only follows VError causes; this also follows native `Error.cause`/axios
  // causes (with a cycle guard). static to mirror VError's own `fullStack(err)`.
  public static fullStack(err: Error): string {
    return BotpressCLIError._fullStack(err, new Set())
  }

  private static _fullStack(err: Error, seen: Set<Error>): string {
    if (seen.has(err)) {
      return '[Circular error cause]'
    }
    seen.add(err)

    const stack = err.stack || err.message
    const cause = BotpressCLIError._cause(err)

    if (!cause) {
      return stack
    }

    return `${stack}\ncaused by: ${BotpressCLIError._fullStack(cause, seen)}`
  }

  private static _cause(err: Error): Error | undefined {
    const vErrorCause = VError.cause(err)
    if (vErrorCause) {
      return vErrorCause
    }

    const nativeCause = (err as { cause?: unknown }).cause
    return nativeCause instanceof Error ? nativeCause : undefined
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
    message: string,
    opts?: { cause?: Error }
  ) {
    if (opts?.cause) {
      super(message, opts)
      return
    }
    super(message)
  }

  public static fromAxios(e: AxiosError<{ message?: string }>): HTTPError {
    const message = this._axiosMsg(e)
    // keep the axios error as a cause so fullStack can show the transport-level chain under --verbose.
    // only its message/stack are ever rendered; never serialize this cause — its config holds auth headers.
    return new HTTPError(e.response?.status, message, { cause: e })
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

export class AbortedOperationError extends BotpressCLIError {
  public constructor() {
    super('Aborted')
  }
}
