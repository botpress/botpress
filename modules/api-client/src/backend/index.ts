import 'bluebird-global'
import * as sdk from 'botpress/sdk'

const entryPoint: sdk.ModuleEntryPoint = {
  definition: {
    name: 'api-client',
    fullName: 'ApiClient',
    homepage: 'https://botpress.com',
    menuIcon: 'timeline-line-chart',
    menuText: 'ApiClient'
  }
}

export default entryPoint
