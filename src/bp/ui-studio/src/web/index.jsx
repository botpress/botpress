import 'babel-polyfill'
import React from 'expose-loader?React!react'
import ReactDOM from 'expose-loader?ReactDOM!react-dom'
import axios from 'axios'
import { HotKeys } from 'react-hotkeys'
import { getToken } from '~/util/Auth'
import { Provider } from 'react-redux'

import store from './store'
import { keyMap } from './keyboardShortcuts'

// Required to fix outline issue
import './style.scss'

require('bootstrap/dist/css/bootstrap.css')
require('storm-react-diagrams/dist/style.min.css')
require('./theme.scss')

const token = getToken()
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token.token}`
}

// Do not use "import App from ..." as hoisting will screw up styling
const App = require('./components/App').default

ReactDOM.render(
  <Provider store={store}>
    <HotKeys keyMap={keyMap}>
      <App />
    </HotKeys>
  </Provider>,
  document.getElementById('app')
)
