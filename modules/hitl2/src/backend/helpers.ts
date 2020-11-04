import { Response } from 'express'
import { ResponseError } from './errors'
import _ from 'lodash'

export const makeAgentId = (strategy: string, email: string): string => {
  return _.join(_.compact([strategy, email]), '/')
}

export const formatError = (res: Response, error: ResponseError) => {
  res.status(error.statusCode)
  res.json({
    errors: error.messages
  })
}
