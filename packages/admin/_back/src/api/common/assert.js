import Joi from 'joi'
import { AssertionError } from '~/errors'

export const validateRequestSchema = (property, req, schema) => {
  const result = Joi.validate(req[property], schema)

  if (result.error) {
    throw new AssertionError(result.error)
  }

  Object.assign(req[property], result.value)
}

export const validateBodySchema = (req, schema) => validateRequestSchema('body', req, schema)
