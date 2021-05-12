import path from 'path'

export const getBaseLookupPaths = (fullPath: string, lastPathPart: string) => {
  const actionLocation = path.dirname(fullPath)

  let parts = path.relative(process.PROJECT_LOCATION, actionLocation).split(path.sep)
  parts = parts.slice(parts.indexOf(lastPathPart) + 1) // We only keep the parts after /actions/...

  const lookups: string[] = [actionLocation, path.join(process.PROJECT_LOCATION, 'shared_libs')]

  if (parts[0] in process.LOADED_MODULES) {
    // the hook/action is in a directory by the same name as a module
    lookups.unshift(process.LOADED_MODULES[parts[0]])
  }

  return lookups
}

export const enabled = (filename: string) => !path.basename(filename).startsWith('.')

export const actionServerIdRegex = /^[a-zA-Z0-9]*$/
