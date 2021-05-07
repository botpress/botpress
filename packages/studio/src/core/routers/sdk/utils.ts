import { SdkApiPayload } from 'botpress/apiSdk'
import { NextFunction, Request, Response } from 'express'
import Joi from 'joi'
import jsonwebtoken from 'jsonwebtoken'
import _ from 'lodash'

import { BadRequestError, UnauthorizedError } from '../errors'

import { validations } from './validation'

export const ACTION_SERVER_AUDIENCE = 'api_user'

export type RequestWithApiUser = Request & {
  apiPayload?: SdkApiPayload
}

export const validateSdkApiPayload = (fnScope: string, validationSchema?: Joi.ObjectSchema) => async (
  req: RequestWithApiUser,
  res: Response,
  next: NextFunction
) => {
  if (!req.headers.authorization) {
    return next(new UnauthorizedError('Authorization header is missing'))
  }

  const [scheme, token] = req.headers.authorization.split(' ')
  if (scheme.toLowerCase() !== 'bearer') {
    return next(new UnauthorizedError(`Unknown scheme "${scheme}"`))
  }

  if (!token) {
    return next(new UnauthorizedError('Authentication token is missing'))
  }

  try {
    const apiPayload = await Promise.fromCallback<SdkApiPayload>(cb => {
      jsonwebtoken.verify(token, process.APP_SECRET, { audience: ACTION_SERVER_AUDIENCE }, (err, user) => {
        cb(err, !err ? (user as SdkApiPayload) : undefined)
      })
    })

    if (!apiPayload) {
      return next(new UnauthorizedError('Invalid API token'))
    }
    const { scopes } = apiPayload

    if (
      !scopes.includes('*') &&
      !scopes.includes(fnScope) &&
      !scopes.includes(fnScope.substr(0, fnScope.indexOf('.')))
    ) {
      return next(new UnauthorizedError(`Missing required scope "${fnScope}"`))
    }

    req.apiPayload = apiPayload
  } catch (err) {
    return next(new UnauthorizedError('Invalid authentication token'))
  }

  try {
    if (validations[fnScope]) {
      await Joi.validate(req.body, validations[fnScope])
    }

    next()
  } catch (err) {
    return next(new BadRequestError(err))
  }
}
