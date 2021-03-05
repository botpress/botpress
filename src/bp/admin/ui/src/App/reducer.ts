import { routerReducer } from 'react-router-redux'
import { combineReducers } from 'redux'

import auth from '~/auth/reducer'
import alerting from '~/health/alerting/reducer'
import checklist from '~/management/checklist/reducer'
import licensing from '~/management/licensing/reducer'
import version from '~/releases/reducer'
import user from '~/user/reducer'
import collaborators from '~/workspace/collaborators/reducer'
import workspaces from '~/workspace/workspaces/reducer'
import monitoring from '../health/monitoring/reducer'
import modules from '../management/modules/reducer'
import bots from '../workspace/bots/reducer'
import roles from '../workspace/roles/reducer'

export type AppState = ReturnType<typeof rootReducer>

const rootReducer = combineReducers({
  routing: routerReducer,
  licensing,
  auth,
  checklist,
  bots,
  user,
  roles,
  collaborators,
  monitoring,
  alerting,
  modules,
  workspaces,
  version
})

export default rootReducer
