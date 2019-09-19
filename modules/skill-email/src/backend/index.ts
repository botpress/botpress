import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { generateFlow } from './email'

export type Extension = {}

export type SDK = typeof sdk & Extension

const onServerStarted = async (bp: SDK) => {}

const onServerReady = async (bp: SDK) => {}

const onModuleUnmount = async (bp: typeof sdk) => {
  bp.http.deleteRouterForBot('skill-email')
}

const skillsToRegister: sdk.Skill[] = [
  {
    id: 'SendEmail',
    name: 'Send Email',
    flowGenerator: generateFlow
  }
]

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onModuleUnmount,
  definition: {
    name: 'skill-email',
    menuIcon: 'email',
    fullName: 'Email Skill',
    homepage: 'https://botpress.io',
    noInterface: true,
    plugins: [],
    moduleView: { stretched: true }
  },
  skills: skillsToRegister
}

export default entryPoint
