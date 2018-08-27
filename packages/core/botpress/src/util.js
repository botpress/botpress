import chalk from 'chalk'
import path from 'path'
import Module from 'module'
import fs from 'fs'
import knex from 'knex'
import generate from 'nanoid/generate'
import semver from 'semver'
import _ from 'lodash'

const IS_DEV = process.env.NODE_ENV !== 'production'

const NPM_CMD = /^win/.test(process.platform) ? 'npm.cmd' : 'npm'

const PRINT_LEVELS = {
  info: chalk.white,
  warn: chalk.yellow.bind(chalk, 'WARN'),
  error: chalk.red.bind(chalk, 'ERR'),
  success: chalk.green.bind(chalk, 'OK')
}

const print = (level, ...args) => {
  let method = PRINT_LEVELS[level]

  if (!method) {
    args = [level].concat(args)
    method = PRINT_LEVELS.info
  }

  console.log(chalk.black.bgWhite('[botpress]'), '\t', method(...args))
}

Object.keys(PRINT_LEVELS).forEach(level => {
  print[level] = (...args) => print(level, ...args)
})

const resolveFromDir = (fromDir, moduleId) => {
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

const resolveModuleRootPath = entryPath => {
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
      throw new Error("Could not find bot's package.json file")
    }
    return null
  }

  return packagePath
}

const getDataLocation = (dataDir, projectLocation) =>
  dataDir && path.isAbsolute(dataDir) ? path.resolve(dataDir) : path.resolve(projectLocation, dataDir || 'data')

const getBotpressVersion = () => {
  const botpressPackagePath = path.join(__dirname, '../package.json')
  const botpressJson = JSON.parse(fs.readFileSync(botpressPackagePath))

  return botpressJson.version
}

const collectArgs = (val, memo) => {
  memo.push(val)
  return memo
}

// https://github.com/tgriesser/knex/issues/1871#issuecomment-273721116
const getInMemoryDb = () =>
  knex({
    client: 'sqlite3',
    connection: ':memory:',
    pool: {
      min: 1,
      max: 1,
      disposeTiemout: 360000 * 1000,
      idleTimeoutMillis: 360000 * 1000
    },
    useNullAsDefault: true
  })

const safeId = (length = 10) => generate('1234567890abcdefghijklmnopqrsuvwxyz', length)

const getPackageName = pkg => {
  const isScoped = pkg.startsWith('@')

  if (isScoped) {
    const [scope, name] = pkg.match(/^@(.*)\/(.*)/).slice(1)
    return [scope, name]
  } else {
    return [null, pkg]
  }
}

const isBotpressPackage = pkg => {
  const [scope, name] = getPackageName(pkg)
  const isBotpress = scope === 'botpress' || name.startsWith('botpress-')
  return isBotpress
}

const getModuleShortname = pkg => {
  const [, name] = getPackageName(pkg)
  const withoutPrefix = name.replace(/^botpress-/i, '')
  return withoutPrefix
}

const getCircularReplacer = () => {
  const seen = new WeakSet()
  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[cyclic reference]'
      }
      seen.add(value)
    }
    return value
  }
}

const safeStringify = o => JSON.stringify(o, getCircularReplacer())

const validateBotVersion = (bpVersion, botfileVersion) => {
  if (botfileVersion == null) {
    throw new Error(`The version field doesn't exist in botfile.js. Set it to "${bpVersion}".`)
  }

  if (_.isEmpty(botfileVersion) || !_.isString(botfileVersion)) {
    throw new Error(`Version in botfile.js must be non-empty string specifying the valid semver (e.g. "${bpVersion}").`)
  }

  try {
    // TODO: change this method if "semver" module will implement semver.isValid()
    semver.valid(botfileVersion)
  } catch (err) {
    throw new Error(`Version in botfile.js must have proper semver format (e.g. "${bpVersion}").`)
  }

  const msgPreamble = `Your bot may be incompatible with botpress v${bpVersion}
  because it looks like it was originally created with botpress v${botfileVersion}.
  To address this `

  if (semver.lt(bpVersion, botfileVersion)) {
    throw new Error(
      msgPreamble +
        'update the versions of botpress and any @botpress/* modules' +
        ` in your package.json to "${botfileVersion}".`
    )
  }

  const botfileMajorVersion = Number(semver.major(botfileVersion))
  const bpMajorVersion = Number(semver.major(bpVersion))

  if (bpMajorVersion > botfileMajorVersion) {
    throw new Error(
      msgPreamble +
        'check https://github.com/botpress/botpress/blob/master/CHANGELOG.md' +
        ' and update your bot for any breaking changes listed there,' +
        ` then update the version in your botfile.js to "${bpVersion}".`
    )
  }
}

module.exports = {
  print,
  resolveFromDir,
  isDeveloping: IS_DEV,
  resolveModuleRootPath,
  resolveProjectFile,
  getDataLocation,
  npmCmd: NPM_CMD,
  getBotpressVersion,
  collectArgs,
  getInMemoryDb,
  safeId,
  isBotpressPackage,
  getModuleShortname,
  safeStringify,
  validateBotVersion
}
