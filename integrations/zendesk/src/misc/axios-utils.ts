import axios from 'axios'
import http from 'http'

type AxiosSummaryErrorProps = {
  request: {
    method: string
    url: string
  } | null
  response: {
    status: number
    statusText: string
    data: unknown
  } | null
}

class AxiosSummaryError extends Error {
  public constructor(props: AxiosSummaryErrorProps) {
    const { request, response } = props

    const messageLines = ['Zendesk API error']
    if (request) {
      messageLines.push(`Request: ${request.method} ${request.url}`)
    }
    if (response) {
      messageLines.push(`Response: ${response.status} (${response.statusText}) ${JSON.stringify(response.data)}`)
    }

    const message = messageLines.map((l) => `\n    ${l}`).join('')
    super(message)
  }
}

/**
 * Axios Requests are too verbose and can pollute logs.
 * This function summarizes the error for better readability.
 */
export const summarizeAxiosError = (thrown: unknown): never => {
  if (!axios.isAxiosError(thrown)) {
    throw thrown
  }

  const { request, response } = thrown

  let parsedRequest: AxiosSummaryErrorProps['request'] = null
  try {
    if (request) {
      // for some reason request is not properly typed in axios error
      const req = request as http.ClientRequest
      const method = req.method
      const url = `${req.protocol}//${req.host}${req.path}`
      parsedRequest = {
        method,
        url,
      }
    }
  } catch {}

  let parsedResponse: AxiosSummaryErrorProps['response'] = null
  if (response) {
    const status = response.status
    const statusText = response.statusText
    const data = response.data
    parsedResponse = {
      status,
      statusText,
      data,
    }
  }

  throw new AxiosSummaryError({
    request: parsedRequest,
    response: parsedResponse,
  })
}
