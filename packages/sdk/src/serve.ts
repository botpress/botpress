import { InvalidPayloadError, isApiError, RuntimeError } from '@botpress/client'
import { isNode } from 'browser-or-node'
import * as http from 'node:http'
import { log } from './log'

export type Request = {
  body?: string
  path: string
  query: string
  method: string
  headers: { [key: string]: string | undefined }
}

export type Response = {
  body?: string
  headers?: { [key: string]: string }
  status?: number
}

export type Handler = (req: Request) => Promise<Response | void>

export function parseBody<T>(req: Request): T {
  if (!req.body) {
    throw new InvalidPayloadError('Missing body')
  }

  try {
    return JSON.parse(req.body)
  } catch (thrown: unknown) {
    throw new InvalidPayloadError(thrown instanceof Error ? thrown.message : String(thrown))
  }
}

/**
 * Maps a thrown handler error to an HTTP response.
 *
 * A deliberately thrown `RuntimeError` indicates a handled, user-facing failure,
 * and an `InvalidPayloadError` indicates a malformed request. Both preserve
 * their original 4xx status so callers do not retry them.
 *
 * Any other error is treated as unhandled and returned as a 500 response so
 * callers can consider it transient.
 */
export const handlerErrorToHttpResponse = ({
  thrown,
  unexpectedErrorMessage,
}: {
  thrown: unknown
  unexpectedErrorMessage: string
}): { status: number; body: string; error: Error } => {
  const error = thrown instanceof Error ? thrown : new Error(String(thrown))

  if (isApiError(error) && (error.type === 'Runtime' || error.type === 'InvalidPayload')) {
    return { status: error.code, body: JSON.stringify(error.toJSON()), error }
  }

  const runtimeError = isApiError(error)
    ? new RuntimeError(error.message, error)
    : new RuntimeError(unexpectedErrorMessage, error)

  return { status: 500, body: JSON.stringify(runtimeError.toJSON()), error: runtimeError }
}

export async function serve(
  handler: Handler,
  port: number = 8072,
  callback: (port: number) => void = defaultCallback
): Promise<http.Server> {
  if (!isNode) {
    throw new Error('This function can only be called in Node.js')
  }

  const httpModule = require('http') as typeof http

  /* eslint-disable @typescript-eslint/no-misused-promises */
  const server = httpModule.createServer(async (req, res) => {
    try {
      const request = await mapIncomingMessageToRequest(req)
      if (request.path === '/health') {
        res.writeHead(200).end('ok')
        return
      }
      const response = await handler(request)
      res.writeHead(response?.status ?? 200, response?.headers ?? {}).end(response?.body ?? '{}')
    } catch (thrown: unknown) {
      const error: string = thrown instanceof Error ? thrown.message : String(thrown)
      log.error('Error while handling request', { error: error ?? 'Internal error occured' })
      res.writeHead(500).end(JSON.stringify({ error: error ?? 'Internal error occured' }))
    }
  })

  server.listen(port, () => callback(port))
  return server
}

async function mapIncomingMessageToRequest(incoming: http.IncomingMessage): Promise<Request> {
  const body = await readBody(incoming)
  const headers = {} as Request['headers']

  for (let i = 0; i < incoming.rawHeaders.length; i += 2) {
    const key = incoming.rawHeaders[i]!.toLowerCase()
    const value = incoming.rawHeaders[i + 1]!
    headers[key] = value
  }

  const url = new URL(
    incoming.url ?? '',
    incoming.headers.host ? `http://${incoming.headers.host}` : 'http://botpress.cloud'
  )

  return {
    body,
    path: url.pathname,
    query: trimPrefix(url.search, '?'),
    headers,
    method: incoming.method?.toUpperCase() ?? 'GET',
  }
}

function trimPrefix(value: string, prefix: string) {
  return value.indexOf(prefix) === 0 ? value.slice(prefix.length) : value
}

async function readBody(incoming: http.IncomingMessage) {
  return new Promise<string | undefined>((resolve, reject) => {
    if (incoming.method !== 'POST' && incoming.method !== 'PUT' && incoming.method !== 'PATCH') {
      return resolve(undefined)
    }

    let body = ''

    incoming.on('data', (chunk) => (body += chunk.toString()))
    incoming.on('error', (e) => reject(e))
    incoming.on('end', () => resolve(body))
  })
}

function defaultCallback(port: number) {
  log.info(`Listening on port ${port}`)
}
