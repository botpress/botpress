export class SynchronizerError extends Error {
  public constructor(message: string, inner: Error) {
    const fullMessage = `${message}: ${inner.message}`
    super(fullMessage)
  }
}

const _toError = (thrown: unknown): Error => (thrown instanceof Error ? thrown : new Error(String(thrown)))
export const mapError =
  (msg: string) =>
  (thrown: unknown): never => {
    throw new SynchronizerError(msg, _toError(thrown))
  }
