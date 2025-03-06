import type { Handler } from '../misc/types'

export const handler: Handler = async ({ req, client, logger }) => {
  if (!req.body) {
    console.warn('Handler received an empty body')
    return {}
  }
}