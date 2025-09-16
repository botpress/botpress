function isAxiosError(err: unknown): err is {
  message: string
  response?: {
    data?: unknown
    status?: number
  }
} {
  return (
    err !== null &&
    typeof err === 'object' &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string' &&
    'response' in err
  )
}

export const getErrorMessage = (err: unknown): string => {
  if (isAxiosError(err)) {
    const data = err.response?.data
    const statusCode = err.response?.status

    if (!data) {
      return `${err.message} (no response data) (Status Code: ${statusCode})`
    }

    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
      return `${printKlaviyoErrors(data)} (Status Code: ${statusCode})`
    }

    return `${err.message} (Status Code: ${statusCode})`
  } else if (err instanceof Error) {
    return err.message || 'Unexpected error'
  } else if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
    return err.message
  } else if (typeof err === 'string') {
    return err
  }

  return 'Unexpected error'
}

const printKlaviyoErrors = (errors: unknown[]): string => {
  return errors
    .map((error) => {
      if (error && typeof error === 'object' && 'detail' in error && typeof error.detail === 'string') {
        return error.detail
      }
      if (error && typeof error === 'object' && 'title' in error && typeof error.title === 'string') {
        return error.title
      }
      if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        return error.message
      }
      return String(error)
    })
    .filter((s): s is string => Boolean(s && s.trim()))
    .join(', ')
}
