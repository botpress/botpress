import * as sdk from 'botpress/runtime-sdk'

import * as renderEnums from '../cms/enums'
import * as dialogEnums from '../dialog/enums'
import * as logEnums from '../logger/enums'

const impl = <typeof sdk>{
  version: process.BOTPRESS_VERSION,
  LoggerLevel: logEnums.LoggerLevel,
  LogLevel: logEnums.LogLevel,
  NodeActionType: dialogEnums.NodeActionType,
  ButtonAction: renderEnums.ButtonAction
}

module.exports = impl
