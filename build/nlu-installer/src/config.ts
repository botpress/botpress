import _ from 'lodash'
import { ArgV } from './typings'

export interface NLUConfig {
  version: string
}

export const validateConfig = (rawConfig: any | undefined, argv: ArgV): NLUConfig => {
  if (!rawConfig) {
    throw new Error(`The config file ${argv.config} has no field "nlu"`)
  }

  if (!_.isString(rawConfig.version)) {
    throw new Error('Field "nlu" should be an object with field "version"')
  }

  return rawConfig
}
