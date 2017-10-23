import React from 'expose?React!react'
import ReactDOM from 'expose?ReactDOM!react-dom'
import { createStore, applyMiddleware, compose } from 'redux'
import { Provider } from 'react-redux'
import thunk from 'redux-thunk'
import reducer from './reducers'

import * as actions from '~/actions'

import App from './components/App'

require('bootstrap/dist/css/bootstrap.css')
require('storm-react-diagrams/dist/style.css')
require('./theme.scss')
require('react-select/dist/react-select.css')

const composeEnhancers =
  typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ name: 'Botpress', actionCreators: actions })
    : compose

const enhancer = composeEnhancers(applyMiddleware(thunk))

const store = createStore(reducer, enhancer)

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('app')
)
