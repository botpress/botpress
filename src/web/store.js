import { createStore, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'
import reducers from './reducers'
import * as actions from '~/actions'

const composeEnhancers =
  typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ name: 'Botpress', actionCreators: actions })
    : compose

const enhancer = composeEnhancers(applyMiddleware(thunk))

export default createStore(reducers, enhancer)
