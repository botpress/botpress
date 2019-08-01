import { Request } from 'express'

export type MiddlewareType = 'bodyParserJson' | 'bodyParserUrlEncoder'

const moduleRegex = /^\/api\/v1\/bots\/[A-Z0-9_-]+\/mod\/([A-Z0-9_-]+)\//i
const disabledModules: { [middleware: string]: string[] } = {}

export function isDisabled(middleware: MiddlewareType, request: Request): boolean {
  const modules = disabledModules[middleware] || []
  const result = moduleRegex.exec(request.path)
  return !!result && modules.includes(result[1].toLowerCase())
}

export function disableForModule(middleware: MiddlewareType, moduleName: string) {
  if (!disabledModules[middleware]) {
    disabledModules[middleware] = []
  }

  disabledModules[middleware].push(moduleName.toLowerCase())
}
