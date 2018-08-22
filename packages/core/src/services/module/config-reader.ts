import fs from 'fs'
import Joi from 'joi'
import json5 from 'json5'
import _ from 'lodash'
import { memoize } from 'lodash-decorators'
import path from 'path'
import yn from 'yn'

import { Logger } from '../../misc/interfaces'
import { TYPES } from '../../misc/types'

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
  any: undefined,
  string: '',
  bool: false
}

/**
 * Load configuration for a specific module in the following precedence order:
 * 1) Default Value (Least precedence)
 * 2) Global Value Override
 * 3) Environement Variable Override
 * 4) Per-bot Override (Most precedence)
 */
export default class ConfigReader {
  constructor(private logger: Logger) {} // TODO Inject ghost as well, to read global config & per-bot config

  // TODO Implement this
  // https://github.com/botpress/botpress/blob/master/packages/core/botpress/src/config-manager/index.js
  // We need to provide the config definition from the module's entrypoint `config` property somehow here

  // TODO We also need to implement this:
  // https://github.com/botpress/botpress/blob/master/packages/core/botpress/src/config-manager/module.js
  // This copies the `config.json` default configuration file from the module's folder into the bot's folder
  // If it was not already there. In our case it should copy this file into the global folder (not per-bot, yet).

  @memoize()
  public getGlobal(moduleName: string) {}

  @memoize()
  public getForBot(moduleName: string, botId: string) {}
}
