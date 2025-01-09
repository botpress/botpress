const _PROTOCOLS = ['http', 'https', 'ws', 'wss'] as const

export type Protocol = (typeof _PROTOCOLS)[number]

export type Path = `/${string}`

export type Url = {
  protocol: Protocol
  host: string
  port?: number
  path?: Path
}

export type UrlParseResult =
  | {
      status: 'success'
      url: Url
    }
  | {
      status: 'error'
      error: string
    }

const toPath = (path: string): Path => {
  if (!path.startsWith('/')) {
    return `/${path}`
  }
  return path as Path
}

export function parse(hostOrUrl: string): UrlParseResult {
  try {
    const url = new URL(hostOrUrl)
    return {
      status: 'success',
      url: {
        protocol: url.protocol.replace(':', '') as Url['protocol'],
        host: url.hostname,
        port: url.port ? parseInt(url.port) : undefined,
        path: toPath(url.pathname),
      },
    }
  } catch (thrown) {
    const message = thrown instanceof Error ? thrown.message : `${thrown}`
    return {
      status: 'error',
      error: message,
    }
  }
}

export const format = (url: Url): string => {
  let formatted = `${url.protocol}://${url.host}`
  if (url.port) {
    formatted += `:${url.port}`
  }
  if (url.path && url.path !== '/') {
    formatted += url.path
  }
  return formatted
}
