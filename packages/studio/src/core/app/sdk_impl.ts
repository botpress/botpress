import * as sdk from 'botpress/sdk'
import * as logEnums from 'core/logger/enums'

const impl = <typeof sdk>{
  version: process.BOTPRESS_VERSION,
  LoggerLevel: logEnums.LoggerLevel,
  LogLevel: logEnums.LogLevel
}

module.exports = impl
