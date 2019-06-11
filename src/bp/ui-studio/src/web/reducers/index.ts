import { combineReducers } from 'redux'

import content, { ContentReducer } from './content'
import flows, { FlowReducer } from './flows'
import ui from './ui'
import user, { UserReducer } from './user'
import modules from './modules'
import skills from './skills'
import notifications from './notifications'
import bots from './bots'
import bot from './bot'
import language from './language'
export * from './selectors'

const bpApp = combineReducers({ bots, content, flows, ui, user, bot, modules, notifications, skills, language })
export default bpApp

export interface RootReducer {
  flows: FlowReducer
  user: UserReducer
  content: ContentReducer
}
