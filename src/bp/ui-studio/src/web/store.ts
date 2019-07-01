import { applyMiddleware, compose, createStore } from 'redux'
import thunk from 'redux-thunk'
import * as actions from '~/actions'

import reducers from './reducers'

const composeEnhancers =
  typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ name: 'Botpress', actionCreators: actions })
    : compose

const enhancer = composeEnhancers(applyMiddleware(thunk))

export default createStore(reducers, enhancer)
