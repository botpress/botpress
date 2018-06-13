/**
 * The Configuration Manager is in charge of the configuration
 * for all the modules. It knows how to provision and load configuration
 * from the right places (env variables, files, botfile).
 * @namespace ConfigurationManager
 * @private
 */

import Joi from 'joi'
import _ from 'lodash'
import yn from 'yn'
import path from 'path'
import fs from 'fs'
import json5 from 'json5'

import ModuleConfiguration from './module'
import { isDeveloping } from '../util'

const validations = {
  any: (value, validation) => validation(value),
  string: (value, validation) => typeof value === 'string' && validation(value),
  choice: (value, validation) => _.includes(validation, value),
  bool: (value, validation) => (yn(value) === true || yn(value) === false) && validation(value)
}

const transformers = {
  bool: value => yn(value)
}

const defaultValues = {
  any: null,
  string: '',
  bool: false
}

const amendOption = (option, name) => {
  const validTypes = _.keys(validations)
  if (!option.type || !_.includes(validTypes, option.type)) {
    throw new Error(`Invalid type (${option.type || ''}) for config key (${name})`)
  }

  const validation = option.validation || (() => true)

  if (typeof option.default !== 'undefined' && !validations[option.type](option.default, validation)) {
    throw new Error(`Invalid default value (${option.default}) for (${name})`)
  }

  if (!option.default && !_.includes(_.keys(defaultValues), option.type)) {
    throw new Error(`Default value is mandatory for type ${option.type} (${name})`)
  }

  return {
    type: option.type,
    required: option.required || false,
    env: option.env || null,
    default: option.default || defaultValues[option.type],
    validation: validation
  }
}

const amendOptions = options => {
  return _.mapValues(options, amendOption)
}

export default class ConfigurationManager {
  constructor(options) {
    if (isDeveloping) {
      const schema = Joi.object().keys({
        configLocation: Joi.string()
          .min(1)
          .required(),
        botfile: Joi.object().required(),
        logger: Joi.object().required()
      })

      Joi.assert(options, schema, 'Invalid constructor elements for Configuration Manager')
    }

    this.configLocation = options.configLocation
    this.botfile = options.botfile
    this.logger = options.logger
    this._memoizedLoadAll = _.memoize(this._loadAll.bind(this))
  }

  _loadFromDefaultValues(options) {
    return _.mapValues(options, value => value.default)
  }

  _loadFromConfigFile(file, options) {
    const filePath = path.resolve(this.configLocation, file)

    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8')
      return json5.parse(content)
    }

    return {}
  }

  _loadFromEnvVariables(options) {
    const obj = {}

    _.mapValues(process.env, (value, key) => {
      if (_.isNil(value)) {
        return
      }
      const entry = _.findKey(options, { env: key })
      if (entry) {
        obj[entry] = value
      }
    })

    return obj
  }

  _loadAll(file, options = {}) {
    options = amendOptions(options)

    let config = this._loadFromDefaultValues(options)
    Object.assign(config, this._loadFromConfigFile(file, options))
    Object.assign(config, this._loadFromEnvVariables(options))

    // Transform the values if there's a transformer for this type of value
    config = _.mapValues(config, (value, key) => {
      const { type } = options[key]
      if (transformers[type]) {
        return transformers[type](value)
      } else {
        return value
      }
    })

    return config
  }

  /**
   * Returns a Configuration for a specific module
   * @param  {Object} module A module object
   * @private
   * @return {ModuleConfiguration} A module-specific configuration
   */
  getModuleConfiguration(module) {
    return new ModuleConfiguration({
      manager: this,
      module: module,
      configLocation: this.configLocation,
      logger: this.logger
    })
  }

  /**
   * Loads configuration from the right module
   * @param  {String} file The name of the configuration file
   * @param  {Object} options
   * @private
   * @return {Object} The full configuration object, assembled from various sources
   */
  async loadAll(file, options, caching = true) {
    const getter = caching ? this._memoizedLoadAll : this._loadAll
    return getter(file, options)
  }

  async get(file, key, options, caching = true) {
    const config = await this.loadAll(file, options, caching)
    return config[key]
  }
}
