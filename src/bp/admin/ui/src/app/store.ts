import { routerMiddleware } from 'connected-react-router'
import { createStore, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'
import history from './history'
import rootReducer from './rootReducer'

const initialState = {}
const enhancers: any[] = []
const middleware = [thunk, routerMiddleware(history)]

if (process.env.NODE_ENV === 'development') {
  const { __REDUX_DEVTOOLS_EXTENSION__ } = window

  if (typeof __REDUX_DEVTOOLS_EXTENSION__ === 'function') {
    enhancers.push(__REDUX_DEVTOOLS_EXTENSION__())
  }
}

const composedEnhancers = compose(applyMiddleware(...middleware), ...enhancers)

const store = createStore(rootReducer, initialState, composedEnhancers)

export default store
export { history }
