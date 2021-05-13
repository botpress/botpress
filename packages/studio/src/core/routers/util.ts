import { Logger, StrategyUser } from 'botpress/sdk'
import { TokenUser } from 'common/typings'
import { asBytes } from 'core/misc/utils'
import { NextFunction, Request, Response } from 'express'
import Joi from 'joi'
import mime from 'mime-types'
import multer from 'multer'
import onHeaders from 'on-headers'

import { BadRequestError } from './errors'

// TODO: Remove BPRequest, AsyncMiddleware and asyncMiddleware from this file

export const monitoringMiddleware = (req, res, next) => {
  const startAt = Date.now()

  onHeaders(res, () => {
    const timeInMs = Date.now() - startAt

    res.setHeader('X-Response-Time', `${timeInMs}ms`)
  })

  next()
}

export const sendSuccess = <T extends {}>(res: Response, message: string = 'Success', payload?: T) => {
  res.json({
    status: 'success',
    message,
    payload: payload || {}
  })
}

/**
 * This method checks that uploaded file respects constraints
 * @example fileUploadMulter(['image/*', 'audio/mpeg'], '150mb)
 * fileUploadMulter(['*'], '1gb)
 */
export const fileUploadMulter = (allowedMimeTypes: string[] = [], maxFileSize?: string) => {
  const allowedMimeTypesRegex = allowedMimeTypes.map(mimeType => {
    // '*' is not a valid regular expression
    if (mimeType === '*') {
      mimeType = '.*'
    }

    return new RegExp(mimeType, 'i')
  })

  return multer({
    fileFilter: (_req, file, cb) => {
      const extMimeType = mime.lookup(file.originalname)
      if (
        allowedMimeTypesRegex.some(regex => regex.test(file.mimetype)) &&
        extMimeType &&
        allowedMimeTypesRegex.some(regex => regex.test(extMimeType))
      ) {
        return cb(null, true)
      }
      cb(new Error(`This type of file is not allowed: ${file.mimetype}`))
    },
    limits: {
      fileSize: (maxFileSize && asBytes(maxFileSize)) || undefined
    }
  }).single('file')
}
