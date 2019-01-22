import { combineReducers } from 'redux'
import { routerReducer } from 'react-router-redux'
import user from './user'
import license from './license'
import versioning from './versioning'
import bots from './bots'
import roles from './roles'

export default combineReducers({
  routing: routerReducer,
  versioning,
  license,
  bots,
  user,
  roles
})
