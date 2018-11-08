import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'

import choice from './choice'
import setup from './setup'

export type Extension = {}

export type SDK = typeof sdk & Extension

const onServerStarted = async (bp: SDK) => {}

const onServerReady = async (bp: SDK) => {
  await setup(bp)
}

const skillsToRegister: sdk.Skill[] = [
  {
    id: 'choice',
    name: 'Choice',
    flowGenerator: choice.generateFlow
  }
]

const serveFile = async (filePath: string): Promise<Buffer> => {
  filePath = filePath.toLowerCase()

  const mapping = {
    'index.js': path.join(__dirname, '../web/web.bundle.js'),
    'choice.js': path.join(__dirname, '../web/choice.bundle.js')
  }

  // Web views
  if (mapping[filePath]) {
    return fs.readFileSync(mapping[filePath])
  }

  return new Buffer('')
}

const config: sdk.ModuleConfig = {
  defaultContentElement: {
    type: 'string',
    required: true,
    default: 'builtin_single-choice',
    env: 'SKILL_CHOICE_CONTENT_ELEMENT'
  },
  defaultContentRenderer: {
    type: 'string',
    required: true,
    default: '#builtin_single-choice',
    env: 'SKILL_CHOICE_CONTENT_RENDERER'
  },
  defaultMaxAttempts: { type: 'string', required: false, default: '3', env: 'SKILL_CHOICE_MAX_ATTEMPTS' },
  matchNumbers: { type: 'bool', required: false, default: true, env: 'SKILL_CHOICE_MATCH_NUMBERS' },
  disableIntegrityCheck: { type: 'bool', required: false, default: false, env: 'SKILL_DISABLE_INTEGRITY_CHECK' },
  matchNLU: { type: 'bool', required: false, default: true, env: 'SKILL_CHOICE_MATCH_NLU' }
}

const defaultConfigJson = `
{
  "defaultContentElement": "builtin_single-choice",
  "defaultContentRenderer": "#builtin_single-choice",
  "defaultMaxAttempts": "3",
  "disableIntegrityCheck": false,
  "matchNumbers": true, // This allows people to type a number to match choices (like 1, 2, 3)
  "matchNLU": true
}
`

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  config,
  defaultConfigJson,
  serveFile: serveFile,
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
