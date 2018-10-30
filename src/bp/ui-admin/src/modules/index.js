import { combineReducers } from 'redux'
import { routerReducer } from 'react-router-redux'
import teams from './teams'
import user from './user'
import license from './license'

export default combineReducers({
  routing: routerReducer,
  teams,
  user,
  license
})
