import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import apiCall from './callApi'
import choice from './choice'
import email from './email'
import slot from './slot'

const onServerReady = async (bp: typeof sdk) => {
  await choice.setup(bp)
}

const onModuleUnmount = async (bp: typeof sdk) => {
  bp.http.deleteRouterForBot('basic-skills')
}

const skillsToRegister: sdk.Skill[] = [
  {
    id: 'choice',
    name: 'Choice',
    icon: 'numbered-list',
    flowGenerator: choice.generateFlow
  },
  {
    id: 'CallAPI',
    name: 'Call API',
    icon: 'code-block',
    flowGenerator: apiCall.generateFlow
  },
  {
    id: 'Slot',
    name: 'Slot Filling',
    icon: 'comparison',
    flowGenerator: slot.generateFlow
  },
  {
    id: 'SendEmail',
    name: 'Send Email',
    icon: 'envelope',
    flowGenerator: email.generateFlow
  }
]

const entryPoint: sdk.ModuleEntryPoint = {
  onServerReady,
  onModuleUnmount,
  definition: {
    name: 'basic-skills',
    menuIcon: 'fiber_smart_record',
    fullName: 'Basic Skills',
    homepage: 'https://botpress.io',
    noInterface: true,
    plugins: [],
    moduleView: { stretched: true }
  },
  skills: skillsToRegister
}

export default entryPoint
