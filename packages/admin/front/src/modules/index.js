import { combineReducers } from 'redux'
import { routerReducer } from 'react-router-redux'
import teams from './teams'
import user from './user'

export default combineReducers({
  routing: routerReducer,
  teams,
  user
})
