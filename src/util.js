import chalk from 'chalk'
import path from 'path'
import Module from 'module'
import fs from 'fs'

const IS_DEV = process.env.NODE_ENV !== 'production'

const NPM_CMD = /^win/.test(process.platform) ? 'npm.cmd' : 'npm'

const print = function(...args) {
  const mapping = {
    info: chalk.white,
    warn: function() { return chalk.yellow('WARN', ...arguments) },
    error: function() { return chalk.red('ERR', ...arguments) },
    success: function() { return chalk.green('OK', ...arguments) }
  }

  let level = mapping[args[0]]
  const matched = !!level

  if (!matched) {
    level = mapping.info
  } else {
    args.splice(0, 1)
  }

  console.log(chalk.black.bgWhite('[botpress]'), '\t', level(...args))
}

const resolveFromDir = function (fromDir, moduleId) {
	fromDir = path.resolve(fromDir)
	const fromFile = path.join(fromDir, 'noop.js')
  try {
  	return Module._resolveFilename(moduleId, {
  		id: fromFile,
  		filename: fromFile,
  		paths: Module._nodeModulePaths(fromDir)
  	})
  } catch (err) {
  	return null
  }
}

const resolveModuleRootPath = function(entryPath) {
  let current = path.dirname(entryPath)
  while (current !== '/') {
    const lookup = path.join(current, 'package.json')
    if (fs.existsSync(lookup)) {
      return current
    }
    current = path.resolve(path.join(current, '..'))
  }
  return null
}

const resolveProjectFile = (file, projectLocation, throwIfNotExist) => {
  const packagePath = path.resolve(projectLocation || './', file)

  if (!fs.existsSync(packagePath)) {
    if (throwIfNotExist) {
      throw new Error('Could not find bot\'s package.json file')
    }
    return null
  }

  return packagePath
}

module.exports = {
  print,
  resolveFromDir,
  isDeveloping: IS_DEV,
  resolveModuleRootPath,
  resolveProjectFile,
  npmCmd: NPM_CMD
}
