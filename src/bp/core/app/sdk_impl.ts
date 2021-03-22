import * as sdk from 'botpress/sdk'
import * as dialogEnums from 'core/dialog/enums'
import * as logEnums from 'core/logger/enums'

const impl = <typeof sdk>{
  version: process.BOTPRESS_VERSION,
  LoggerLevel: logEnums.LoggerLevel,
  LogLevel: logEnums.LogLevel,
  NodeActionType: dialogEnums.NodeActionType
}

module.exports = impl
