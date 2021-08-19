import { BUILTIN_MODULES } from 'common/defaults'
import { ActionScope } from 'common/typings'
import { requireAtPaths } from 'core/modules/utils/require'
import path from 'path'

export const getBaseLookupPaths = (fullPath: string, lastPathPart: string, botId?: string) => {
  const actionLocation = path.dirname(fullPath)

  let parts = path.relative(process.PROJECT_LOCATION, actionLocation).split(path.sep)
  parts = parts.slice(parts.indexOf(lastPathPart) + 1) // We only keep the parts after /actions/...

  const lookups: string[] = [actionLocation]

  if (botId) {
    lookups.push(path.join(process.PROJECT_LOCATION, 'data/bots', botId, 'libraries'))
  }

  lookups.push(path.join(process.PROJECT_LOCATION, 'shared_libs'))

  if (parts[0] in process.LOADED_MODULES) {
    // the hook/action is in a directory by the same name as a module
    lookups.unshift(process.LOADED_MODULES[parts[0]])
  }

  return lookups
}

export const prepareRequire = (fullPath: string, lookups: string[]) => {
  return module => requireAtPaths(module, lookups, fullPath)
}

export const prepareRequireTester = (parentScript: string, lookups: string[]) => {
  const _require = module => requireAtPaths(module, lookups, parentScript)

  return (file: string) => {
    try {
      _require(file)
      return true
    } catch (err) {
      return false
    }
  }
}

export const extractRequiredFiles = (code: string) => {
  const commentRegex = /\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm
  const requireRegex = /require\([\\'"]?(.*?)[\\'"]?\)/gm

  const withoutComments = code.replace(commentRegex, '')
  const files: string[] = []

  let match
  while ((match = requireRegex.exec(withoutComments))) {
    files.push(match[1])
  }

  return files
}

export const filterDisabled = (filesPaths: string[]): string[] => filesPaths.filter(enabled)

export const enabled = (filename: string) => !path.basename(filename).startsWith('.')

export const isTrustedAction = (actionName: string) =>
  !!BUILTIN_MODULES.find(module => actionName.startsWith(`${module}/`))

export const actionServerIdRegex = /^[a-zA-Z0-9]*$/

export const runOutsideVm = (scope: ActionScope): boolean => {
  return (process.DISABLE_GLOBAL_SANDBOX && scope === 'global') || (process.DISABLE_BOT_SANDBOX && scope !== 'global')
}
