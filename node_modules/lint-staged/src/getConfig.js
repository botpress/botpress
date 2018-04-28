/* eslint no-prototype-builtins: 0 */

'use strict'

const chalk = require('chalk')
const format = require('stringify-object')
const intersection = require('lodash/intersection')
const defaultsDeep = require('lodash/defaultsDeep')
const isObject = require('lodash/isObject')
const validate = require('jest-validate').validate
const logValidationWarning = require('jest-validate').logValidationWarning
const unknownOptionWarning = require('jest-validate/build/warnings').unknownOptionWarning
const isGlob = require('is-glob')

/**
 * Default config object
 *
 * @type {{concurrent: boolean, chunkSize: number, gitDir: string, globOptions: {matchBase: boolean, dot: boolean}, linters: {}, subTaskConcurrency: number, renderer: string, verbose: boolean}}
 */
const defaultConfig = {
  concurrent: true,
  chunkSize: Number.MAX_SAFE_INTEGER,
  gitDir: '.',
  globOptions: {
    matchBase: true,
    dot: true
  },
  linters: {},
  subTaskConcurrency: 1,
  renderer: 'update',
  verbose: false
}

/**
 * Check if the config is "simple" i.e. doesn't contains any of full config keys
 *
 * @param config
 * @returns {boolean}
 */
function isSimple(config) {
  return (
    isObject(config) &&
    !config.hasOwnProperty('linters') &&
    intersection(Object.keys(defaultConfig), Object.keys(config)).length === 0
  )
}

/**
 * Custom jest-validate reporter for unknown options
 * @param config
 * @param example
 * @param option
 * @param options
 * @returns {void}
 */
function unknownValidationReporter(config, example, option, options) {
  /**
   * If the unkonwn property is a glob this is probably
   * a typical mistake of mixing simple and advanced configs
   */
  if (isGlob(option)) {
    const message = `  Unknown option ${chalk.bold(`"${option}"`)} with value ${chalk.bold(
      format(config[option], { inlineCharacterLimit: Number.POSITIVE_INFINITY })
    )} was found in the config root.

  You are probably trying to mix simple and advanced config formats. Adding

  ${chalk.bold(`"linters": {
    "${option}": ${JSON.stringify(config[option])}
  }`)}

  will fix it and remove this message.`

    const comment = options.comment
    const name = (options.title && options.title.warning) || 'WARNING'
    return logValidationWarning(name, message, comment)
  }
  // If it is not glob pattern, use default jest-validate reporter
  return unknownOptionWarning(config, example, option, options)
}

/**
 * For a given configuration object that we retrive from .lintstagedrc or package.json
 * construct a full configuration with all options set.
 *
 * This is a bit tricky since we support 2 different syntxes: simple and full
 * For simple config, only the `linters` configuration is provided.
 *
 * @param {Object} sourceConfig
 * @returns {{
 *  concurrent: boolean, chunkSize: number, gitDir: string, globOptions: {matchBase: boolean, dot: boolean}, linters: {}, subTaskConcurrency: number, renderer: string, verbose: boolean
 * }}
 */
function getConfig(sourceConfig) {
  const config = defaultsDeep(
    {}, // Do not mutate sourceConfig!!!
    isSimple(sourceConfig) ? { linters: sourceConfig } : sourceConfig,
    defaultConfig
  )

  // Check if renderer is set in sourceConfig and if not, set accordingly to verbose
  if (isObject(sourceConfig) && !sourceConfig.hasOwnProperty('renderer')) {
    config.renderer = config.verbose ? 'verbose' : 'update'
  }

  return config
}

/**
 * Runs config validation. Throws error if the config is not valid.
 * @param config {Object}
 * @returns config {Object}
 */
function validateConfig(config) {
  const exampleConfig = Object.assign({}, defaultConfig, {
    linters: {
      '*.js': ['eslint --fix', 'git add'],
      '*.css': 'stylelint'
    }
  })

  const validation = validate(config, {
    exampleConfig,
    unknown: unknownValidationReporter,
    comment:
      'Please refer to https://github.com/okonet/lint-staged#configuration for more information...'
  })

  if (!validation.isValid) {
    throw new Error('lint-staged config is invalid... Aborting.')
  }

  return config
}

module.exports = {
  getConfig,
  validateConfig
}
