import { combineReducers } from 'redux'
import { routerReducer } from 'react-router-redux'
import teams from './teams'
import user from './user'
import license from './license'
import versioning from './versioning'

export default combineReducers({
  routing: routerReducer,
  versioning,
  license,
  teams,
  user,
})
