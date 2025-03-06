import type { Handler } from '../misc/types'

export const handler: Handler = async ({ req }) => {
  if (!req.body) {
    console.warn('Handler received an empty body')
    return {}
  }
}
