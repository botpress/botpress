import axios, { AxiosError } from 'axios'
import { VError } from 'verror'

export * from './gen/client/errors'

export class ChatClientError extends VError {
  public static wrap(thrown: unknown, message: string): ChatClientError {
    const err = ChatClientError.map(thrown)
    return new ChatClientError(err, message ?? '')
  }

  public static map(thrown: unknown): ChatClientError {
    if (thrown instanceof ChatClientError) {
      return thrown
    }
    if (axios.isAxiosError(thrown)) {
      return ChatHTTPError.fromAxios(thrown)
    }
    if (thrown instanceof Error) {
      const { message } = thrown
      return new ChatClientError(message)
    }
    return new ChatClientError(String(thrown))
  }

  public constructor(error: ChatClientError, message: string)
  public constructor(message: string)
  public constructor(first: ChatClientError | string, second?: string) {
    if (typeof first === 'string') {
      super(first)
      return
    }
    super(first, second!)
  }
}

export class ChatHTTPError extends ChatClientError {
  public constructor(
    public readonly status: number | undefined,
    message: string
  ) {
    super(message)
  }

  public static fromAxios(e: AxiosError<{ message?: string }>): ChatHTTPError {
    const message = this._axiosMsg(e)
    return new ChatHTTPError(e.response?.status, message)
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

export class ChatConfigError extends ChatClientError {
  public constructor(message: string) {
    super(message)
  }
}
