import { combineReducers } from 'redux'

import content from './content'
import flows from './flows'
import ui from './ui'
import user from './user'
import modules from './modules'
import skills from './skills'
import notifications from './notifications'
import bots from './bots'
import bot from './bot'
import language from './language'
export * from './selectors'

const bpApp = combineReducers({ bots, content, flows, ui, user, bot, modules, notifications, skills, language })
export default bpApp
