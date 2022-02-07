import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import en from '../translations/en.json'
import es from '../translations/es.json'
import fr from '../translations/fr.json'

import api from './api'

import * as component from './components'

// At this point, you would likely setup the API route of your module.
const onServerReady = async (bp: typeof sdk) => {
  await api(bp)
}

const onModuleUnmount = async (bp: typeof sdk) => {
  bp.http.deleteRouterForBot('components')
}

export const componentSnippetRegister: component.ComponentSnippet[] = [
  {
    id: 'api-call',
    name: 'module.basic-components.apiCall',
    flowGenerator: component.ApiCall.generateFlow
  },
  {
    id: 'Fallback',
    name: 'module.basic-components.feedback',
    flowGenerator: component.Fallback.generateFlow
  },
  {
    id: 'Greeting',
    name: 'module.basic-components.greeting',
    flowGenerator: component.Greeting.generateFlow
  },
  {
    id: 'PolarAnswer',
    name: 'module.basic-components.polarAnswer',
    flowGenerator: component.PolarAnswer.generateFlow
  }
]

const entryPoint: sdk.ModuleEntryPoint = {
  onServerReady,
  onModuleUnmount,
  translations: { en, fr, es },
  definition: {
    name: 'basic-components',
    fullName: 'Basic-Components',
    homepage: 'https://botpress.com',
    noInterface: true,
    plugins: [],
    moduleView: { stretched: true }
  }
}

export default entryPoint
