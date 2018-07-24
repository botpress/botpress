import chalk from 'chalk'
import path from 'path'
import Module from 'module'
import fs from 'fs'
import knex from 'knex'
import generate from 'nanoid/generate'
import semver from 'semver'
import _ from 'lodash'
import { compose } from 'lodash/fp'

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

const getPackageName = pkg => {
  const isScoped = pkg.startsWith('@')

  if (isScoped) {
    const [scope, name] = pkg.match(/^@(.*)\/(.*)/).slice(1)
    return [scope, name]
  } else {
    return [null, pkg]
  }
}

const versionExists = version => {
  if (version == null) {
    throw new Error("Version doesn't exist in botfile.js")
  }

  return version
}
const isValidString = version => {
  if (_.isEmpty(version) || !_.isString(version)) {
    throw new Error('Version must be non-empty string')
  }

  return version
}
const isValidFormat = version => {
  try {
    // TODO: change this method if "semver" module will implement semver.isValid()
    semver.valid(version)
  } catch (err) {
    throw new Error('Version must have semver format (e.g. 10.25.0)')
  }

  return version
}
const isEqualOrGreater = packageVersion => botfileVersion => {
  const botfileMajorVersion = Number(semver.major(botfileVersion))
  const packageMajorVersion = Number(semver.major(packageVersion))

  const msg = `Your bot may be incompatible with botpress v${packageVersion}
  because it looks like your bot was originally created with botpress v${botfileVersion}.
  To address this:

  - if the major versions are identical the fix is to update to botpress v${botfileVersion} by changing the botpress and all @botpress/* modules version in the bot's package.json
  - if the botpress major version is below the botfile's major version — same
  - if the botpress major version is above the botfile's major version - link to CHANGELOG in the repo root and suggest looking for and addressing the breaking changes listed there`

  if (botfileMajorVersion !== packageMajorVersion || semver.lt(packageMajorVersion, botfileVersion)) {
    throw new Error(msg)
  }

  return botfileVersion
}

const validateVersion = packageVersion =>
  compose(isEqualOrGreater(packageVersion), isValidFormat, isValidString, versionExists)

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
  validateVersion
}
