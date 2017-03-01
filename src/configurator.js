import _ from 'lodash'

const validations = {
  'any': (value, validation) => validation(value),
  'string': (value, validation) => typeof(value) === 'string' && validation(value),
  'choice': (value, validation) => _.includes(validation, value),
  'bool': (value, validation) => (value === true || value === false) && validation(value)
}

const defaultValues = {
  'any': null,
  'string': '',
  'bool': false
}

const amendOption = (option, name) => {

  const validTypes = _.keys(validations)
  if (!option.type || !_.includes(validTypes, option.type)) {
    throw new Error(`Invalid type (${option.type || ''}) for config key (${name})`)
  }

  const validation = option.validation || (() => true)

  if (typeof(option.default) !== 'undefined' && !validations[option.type](option.default, validation)) {
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

const validateSet = (options, name, value) => {

  // if name is not in options, throw
  if (!_.includes(_.keys(options), name)) {
    throw new Error('Unrecognized configuration key: ' + name)
  }

  if (!validations[options[name].type](value, options[name].validation)) {
    throw new Error('Invalid value for key: ' + name)
  }
}

const validateSave = (options, object) => {
  const objKeys = _.keys(object)
  const requiredKeys = _.filter(_.keys(options), key => options[key].required)

  _.each(requiredKeys, required => {
    if (!_.includes(objKeys, required)) {
      throw new Error(`Missing required configuration "${required}"`)
    }
  })

  _.each(objKeys, name => {
    validateSet(options, name, object[name])
  })
}

const validateName = name => {
  if (!name || !/^[A-Z0-9._-]+$/i.test(name)) {
    throw new Error('Invalid configuration name: ' + name + '. The name must only contain letters, _ and -')
  }
}

const overwriteFromDefaultValues = (options, object) => {
  _.each(_.keys(options), name => {
    if (typeof object[name] === 'undefined') {
      object[name] = options[name].default
    }
  })

  return object
}

const overwriteFromEnvValues = (options, object) => {
  return _.mapValues(object, (_v, name) => {
    if (options[name] && options[name].env && process.env[options[name].env]) {
      return process.env[options[name].env]
    }

    return _v
  })
}

const overwriteFromBotfileValues = (config_name, options, botfile, object) => {
  return _.mapValues(object, (_v, name) => {
    if (botfile && botfile.config && botfile.config[config_name] && typeof botfile.config[config_name][name] !== 'undefined') {
      return botfile.config[config_name][name]
    }

    return _v
  })
}

const removeUnusedKeys = (options, object) => {
  const final = {}

  _.each(_.keys(options), name => {
    if (typeof object[name] !== 'undefined') {
      final[name] = object[name]
    }
  })

  return final
}

const createConfig = ({ kvs, name, botfile = {}, options = {} }) => {

  if (!kvs || !kvs.get || !kvs.set) {
    throw new Error(`A valid 'kvs' is mandatory to createConfig`)
  }

  validateName(name)
  options = amendOptions(options)

  const saveAll = obj => {
    validateSave(options, obj)
    return kvs.set('__config', obj, name)
  }

  const loadAll = () => {
    return kvs.get('__config', name)
    .then(all => overwriteFromDefaultValues(options, all || {}))
    .then(all => overwriteFromBotfileValues(name, options, botfile, all))
    .then(all => overwriteFromEnvValues(options, all))
    .then(all => removeUnusedKeys(options, all))
  }

  const get = name => {
    return kvs.get('__config', name + '.' + name)
    .then(value => overwriteFromDefaultValues(options, { [name]: value }))
    .then(all => overwriteFromBotfileValues(name, options, botfile, all))
    .then(all => overwriteFromEnvValues(options, all))
    .then(obj => obj[name])
  }

  const set = (name, value) => {
    validateSet(options, name, value)
    return kvs.set('__config', value, name + '.' + name)
  }
  
  return { saveAll, loadAll, get, set, options }
}

module.exports = { createConfig }
