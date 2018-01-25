import { combineReducers } from 'redux'

import content from './content'
import flows from './flows'
import license from './license'
import ui from './ui'
import user from './user'
import bot from './bot'
import modules from './modules'
import skills from './skills'
import rules from './rules'
import notifications from './notifications'
export * from './selectors'

const bpApp = combineReducers({ content, flows, license, ui, user, bot, modules, rules, notifications, skills })
export default bpApp
