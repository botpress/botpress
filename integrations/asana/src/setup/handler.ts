import type { Handler } from '../misc/types'

class NotImplementedError extends Error {
  public constructor() {
    super('Not implemented')
  }
}

export const handler: Handler = async () => {
  throw new NotImplementedError()
}
