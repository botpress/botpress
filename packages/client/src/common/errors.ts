import axios from 'axios'
import * as errors from '../errors'

export const toApiError = (err: unknown): Error => {
  if (axios.isAxiosError(err) && err.response?.data) {
    return errors.errorFrom(err.response.data)
  }
  return errors.errorFrom(err)
}
