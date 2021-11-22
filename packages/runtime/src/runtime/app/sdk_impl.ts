import * as sdk from 'botpress/runtime-sdk'
import * as renderEnums from 'runtime/cms/enums'
import * as dialogEnums from 'runtime/dialog/enums'
import * as logEnums from 'runtime/logger/enums'

const impl = <typeof sdk>{
  version: process.BOTPRESS_VERSION,
  LoggerLevel: logEnums.LoggerLevel,
  LogLevel: logEnums.LogLevel,
  NodeActionType: dialogEnums.NodeActionType,
  ButtonAction: renderEnums.ButtonAction
}

module.exports = impl
