import * as sdk from 'botpress/sdk'
import * as enums from 'core/sdk/enums'

const impl = <typeof sdk>{
  version: process.BOTPRESS_VERSION,
  LoggerLevel: enums.LoggerLevel,
  LogLevel: enums.LogLevel,
  NodeActionType: enums.NodeActionType
}

module.exports = impl
