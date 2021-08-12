import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import en from '../translations/en.json'
import es from '../translations/es.json'
import fr from '../translations/fr.json'

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
    name: 'module.basic-skills.choice',
    icon: 'numbered-list',
    flowGenerator: choice.generateFlow
  },
  {
    id: 'CallAPI',
    name: 'module.basic-skills.callApi',
    icon: 'code-block',
    flowGenerator: apiCall.generateFlow
  },
  {
    id: 'Slot',
    name: 'module.basic-skills.slotFilling',
    icon: 'comparison',
    flowGenerator: slot.generateFlow
  },
  {
    id: 'SendEmail',
    name: 'module.basic-skills.sendEmail',
    icon: 'envelope',
    flowGenerator: email.generateFlow
  }
]

const entryPoint: sdk.ModuleEntryPoint = {
  onServerReady,
  onModuleUnmount,
  translations: { en, fr, es },
  definition: {
    name: 'basic-skills',
    fullName: 'Basic Skills',
    homepage: 'https://botpress.com',
    noInterface: true,
    plugins: [],
    moduleView: { stretched: true }
  },
  skills: skillsToRegister
}

export default entryPoint
