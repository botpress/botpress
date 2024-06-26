import { ZodError, z } from '@botpress/sdk'
import axios from 'axios'
import _ from 'lodash'

export const getErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data
    const statusCode = err.response?.status

    if (!data) {
      return `${err.message} (Status Code: ${statusCode})`
    }

    if (_.isArray(data.errors)) {
      return `${printZodErrors(data.errors)} (Status Code: ${statusCode})`
    }

    return `${data.message || data.error?.message || data.error || err.message} (Status Code: ${statusCode})`
  } else if (err instanceof ZodError) {
    return printZodErrors(err.errors)
  } else if (err instanceof Error) {
    return err.message || 'Unexpected error'
  } else if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
    return err.message
  } else if (typeof err === 'string') {
    return err
  }

  return 'Unexpected error'
}

const printZodErrors = (errors: z.ZodIssue[]) =>
  `Validation Error: ${errors
    .map((x) => `${x.path.length > 0 ? `'${joinPath(x.path)}': ` : ''} ${x.message}`)
    .join('\n')}`

const joinPath = (path: (string | number)[]): string => {
  if (path.length === 1) {
    return path[0]!.toString()
  }

  return path.reduce<string>((acc, item) => {
    if (typeof item === 'number') {
      return `${acc}[${item}]`
    }

    return `${acc}${acc.length === 0 ? '' : '.'}${item}`
  }, '')
}
