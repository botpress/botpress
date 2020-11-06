import crypto from 'crypto'
import { Response } from 'express'

import { ResponseError } from './errors'

export const makeAgentId = (strategy: string, email: string): string => {
  return crypto
    .createHash('md5')
    .update([strategy, email].filter(Boolean).join('-'))
    .digest('hex')
}

export const formatError = (res: Response, error: ResponseError) => {
  res.status(error.statusCode)
  res.json({
    errors: error.messages
  })
}
