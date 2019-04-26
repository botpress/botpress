import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import choice from './choice'
import apiCall from './callApi'
import slot from './slot'

export type Extension = {}

export type SDK = typeof sdk & Extension

const onServerStarted = async (bp: SDK) => {}

const onServerReady = async (bp: SDK) => {
  await choice.setup(bp)
}

const onModuleUnmount = async (bp: typeof sdk) => {
  bp.http.deleteRouterForBot('basic-skills')
}

const skillsToRegister: sdk.Skill[] = [
  {
    id: 'choice',
    name: 'Choice',
    flowGenerator: choice.generateFlow
  },
  {
    id: 'CallAPI',
    name: 'Call API',
    flowGenerator: apiCall.generateFlow
  },
  {
    id: 'Slot',
    name: 'Slot',
    flowGenerator: slot.generateFlow
  }
]

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
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
