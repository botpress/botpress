import { routerReducer } from 'react-router-redux'
import { combineReducers } from 'redux'

import bots, { BotState } from './bots'
import license from './license'
import modules, { ModulesState } from './modules'
import monitoring from './monitoring'
import roles, { RoleState } from './roles'
import server from './server'
import user, { UserState } from './user'
import version, { VersionState } from './versions'

export interface AppState {
  roles: RoleState
  modules: ModulesState
  user: UserState
  bots: BotState
  version: VersionState
}

export default combineReducers<AppState>({
  routing: routerReducer,
  license,
  bots,
  user,
  roles,
  monitoring,
  modules,
  server,
  version
})
