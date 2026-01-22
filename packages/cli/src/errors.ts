import * as client from '@botpress/client'
import axios, { AxiosError } from 'axios'
import { VError } from 'verror'
import * as consts from './consts'
import { t } from './locales'

type KnownApiError = Exclude<client.ApiError, client.UnknownError>
const isUnknownApiError = (e: unknown): e is client.UnknownError => client.isApiError(e) && e.type === 'Unknown'
const isKnownApiError = (e: unknown): e is KnownApiError => client.isApiError(e) && e.type !== 'Unknown'

export class BotpressCLIError extends VError {
  public static wrap(thrown: unknown, message: string): BotpressCLIError {
    const err = BotpressCLIError.map(thrown)
    return new BotpressCLIError(err, message ?? '')
  }

  public static map(thrown: unknown): BotpressCLIError {
    if (thrown instanceof BotpressCLIError) {
      return thrown
    }
    if (isUnknownApiError(thrown)) {
      const cause = thrown.error?.cause
      if (cause && typeof cause === 'object' && 'code' in cause && cause.code === 'ECONNREFUSED') {
        return new HTTPError(500, t.errors.connectionRefused)
      }

      const unknownMessage = t.errors.unknownApiError
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
      const { message } = thrown
      return new BotpressCLIError(message)
    }
    return new BotpressCLIError(String(thrown))
  }

  public constructor(error: BotpressCLIError, message: string)
  public constructor(message: string)
  public constructor(first: BotpressCLIError | string, second?: string) {
    if (typeof first === 'string') {
      super(first)
      return
    }
    super(first, second!)
  }
}

export class ExclusiveBotFeatureError extends BotpressCLIError {
  public constructor() {
    super(t.errors.exclusiveBotFeature)
  }
}

export class ExclusiveIntegrationFeatureError extends BotpressCLIError {
  public constructor() {
    super(t.errors.exclusiveIntegrationFeature)
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
    super(t.errors.noBundleFound)
  }
}

export class NoBotsFoundError extends BotpressCLIError {
  public constructor() {
    super(t.errors.noBotsFound(consts.defaultBotpressAppUrl))
  }
}

export class NoWorkspacesFoundError extends BotpressCLIError {
  public constructor() {
    super(t.errors.noWorkspacesFound)
  }
}

export class NotLoggedInError extends BotpressCLIError {
  public constructor() {
    super(t.errors.notLoggedIn)
  }
}

export class ParamRequiredError extends BotpressCLIError {
  public constructor(param: string) {
    super(t.errors.paramRequired(param))
  }
}

export class InvalidPackageReferenceError extends BotpressCLIError {
  public constructor(ref: string) {
    super(t.errors.invalidPackageRef(ref))
  }
}

export class UnsupportedProjectType extends BotpressCLIError {
  public constructor() {
    super(t.errors.unsupportedProjectType)
  }
}

export class ProjectDefinitionNotFoundError extends BotpressCLIError {
  public constructor(workdir: string) {
    super(t.errors.projectNotFound(workdir))
  }
}

export class AbortedOperationError extends BotpressCLIError {
  public constructor() {
    super(t.errors.aborted)
  }
}
