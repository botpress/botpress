export function isNetworkError(error: unknown): error is {
  status?: number
  body?: any
  request?: {
    data?: unknown
    body?: unknown
  }
  response?: {
    status?: number
    text?: string
    req: {
      method: string
      url: string
      headers: Record<string, string>
      data?: unknown
      body?: unknown
    }
    header: Record<string, string>
  }
} {
  return typeof error === 'object' && error !== null && 'status' in error
}

export function getNetworkErrorDetails(error: unknown):
  | {
      message: string
      status?: number
      data?: unknown
      requestBody?: unknown
    }
  | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined
  }

  if (!isNetworkError(error)) {
    return undefined
  }

  // Parse error message from various formats
  let message: string | undefined

  // Check for Sunshine Conversations API error format (errors array in body)
  if (Array.isArray(error.body?.errors)) {
    const errorMessages = (error.body.errors as Array<{ title?: string; code?: string }>)
      .map((err) => {
        if (err.title) {
          return err.code ? `${err.title}: ${err.code}` : err.title
        }
        return JSON.stringify(err)
      })
      .filter((msg): msg is string => msg !== undefined)

    if (errorMessages.length > 0) {
      message = errorMessages.join('; ')
    }
  } else if (error.body?.message?.length) {
    message = error.body?.message
  } else if (error.body) {
    message = JSON.stringify(error.body)
  }

  const requestBody =
    error.request?.data ?? error.request?.body ?? error.response?.req?.data ?? error.response?.req?.body

  return {
    message: message ?? 'Unknown error',
    status: error.status ?? error.response?.status,
    data: error.body,
    requestBody,
  }
}
