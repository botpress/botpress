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
  constructor(private logger: Logger) {}

  // TODO Implement this
  // https://github.com/botpress/botpress/blob/master/packages/core/botpress/src/config-manager/index.js

  @memoize()
  public getGlobal(moduleName: string) {}

  @memoize()
  public getForBot(moduleName: string, botId: string) {}
}
