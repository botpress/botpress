import * as errors from '../errors'
import { isHttpError } from './http'

export const toApiError = (err: unknown): Error => {
  if (isHttpError(err) && err.response?.data) {
    return errors.errorFrom(err.response.data)
  }
  return errors.errorFrom(err)
}
