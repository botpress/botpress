import * as sdk from 'botpress/sdk'
import * as enums from 'core/sdk/enums'

const impl = <typeof sdk>{
  version: '11.0-alpha.1',
  LoggerLevel: enums.LoggerLevel
}

// const injectEventService = (EventService) => {
//   sdk.IO.EventService = EventService
// }

// const awaitInitialized = async () => {

// }

module.exports = impl
