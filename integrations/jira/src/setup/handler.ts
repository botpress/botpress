import type { Handler } from '../misc/types'

class NotImplementedError extends Error {
  constructor() {
    super('Not implemented')
  }
}

export const handler: Handler = async () => {
  throw new NotImplementedError()
}
