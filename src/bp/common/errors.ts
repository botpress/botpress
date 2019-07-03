/**
 * Using enum (with a summary of the code purpose) so we can use autocomplete feature,
 * ex typing BPErrorCode.BP_025 and seeing the short message with intellisense
 */
export enum BPErrorCode {
  /** Critical Error */
  BP_000,
  /** Element not found */
  BP_404,
  /** Error loading debug scopes */
  BP_098,
  /** Redis URL missing */
  BP_025
}

// A more detailed message explaining the issue, along with its behavior
export const errors: { [errorCode: number]: ErrorOptions } = {
  [BPErrorCode.BP_000]: { message: 'Critical Error', captureStackTrace: true },
  [BPErrorCode.BP_404]: { message: 'Ressource not found', skipLogging: true },
  [BPErrorCode.BP_098]: { message: `Couldn't load debug scopes. Check the syntax of debug.json` },
  [BPErrorCode.BP_025]: {
    message: `The environment variable REDIS_URL is required when cluster is enabled`,
    supportUrl: 'https://botpress.io/docs/advanced/configuration/',
    skipLogging: true
  }
}

export interface ErrorOptions {
  message?: string
  /**
   * Link to documentation. Or maybe we can omit it and add a standard error documentation page?
   * Ex: https://botpress.io/docs/errors/${BPErrorCode}
   */
  supportUrl?: string
  // Status code for express
  statusCode?: number
  // Only returns the error code, doesn't logs anything to logs
  skipLogging?: boolean
  captureStackTrace?: boolean
}

export class BPError extends Error {
  errorCode?: string // Internal Botpress Error code
  statusCode?: number
  supportUrl?: string
  skipLogging = false

  constructor(code: BPErrorCode, options?: ErrorOptions) {
    super((options && options.message) || errors[code].message)

    this.errorCode = BPErrorCode[code]
    this.statusCode = (options && options.statusCode) || 400
    this.supportUrl = (options && options.supportUrl) || errors[code].supportUrl

    if ((options && options.captureStackTrace) || errors[code].captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

// Possible usages
const example = () => {
  throw new BPError(BPErrorCode.BP_000)
}

// Or shortcut for common ones
export class BotNotFound extends BPError {
  constructor(message?: string) {
    super(BPErrorCode.BP_404, { skipLogging: true, message })
  }
}

const example2 = () => {
  throw new BotNotFound()
}
