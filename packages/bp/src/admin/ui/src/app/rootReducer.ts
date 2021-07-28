import { connectRouter } from 'connected-react-router'
import { Action, combineReducers } from 'redux'
import { ThunkAction } from 'redux-thunk'

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
import history from './history'
import ui from './uiReducer'

const rootReducer = combineReducers({
  router: connectRouter(history),
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
  version,
  ui
})

export type AppState = ReturnType<typeof rootReducer>
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, AppState, unknown, Action<string>>

export default rootReducer
