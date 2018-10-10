import fs from 'fs'
import Module from 'module'
import path from 'path'

const originalRequire = Module.prototype.require

const prefix = 'bp/modules/'

export const resolveModulePath = args => {
  let modulesPath = <string>process.env.BP_MODULES_PATH

  if (!(modulesPath && modulesPath.length)) {
    if (process.pkg) {
      // going from `xx/out/bp` to `xx/modules`
      modulesPath = path.join(path.dirname(process.pkg.entrypoint), '../../modules')
    } else {
      // `xx/src/bp/core` --> `xx/modules`
      modulesPath = path.resolve(__dirname, '../../../modules')
    }
  }

  const moduleName = args[0].substr(prefix.length)
  const dir = path.resolve(process.cwd(), modulesPath, moduleName)

  if (!fs.existsSync(dir)) {
    throw new Error(
      `Couldn't find Native botpress module "${moduleName}" at path "${dir}". Perhaps you forgot to set the BP_MODULES_PATH env variable to point to the modules directory?`
    )
  }

  return dir
}

Module.prototype.require = function() {
  if (arguments && arguments[0].startsWith(prefix)) {
    const dirPath = resolveModulePath(arguments)
    addToNodePath(path.resolve(dirPath, 'node_modules'))

    return originalRequire.apply(this, [dirPath])
  }
  return originalRequire.apply(this, arguments)
}
