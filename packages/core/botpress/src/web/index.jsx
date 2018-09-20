import 'babel-polyfill'
import React from 'expose-loader?React!react'
import ReactDOM from 'expose-loader?ReactDOM!react-dom'

import axios from 'axios'
import { getToken } from '~/util/Auth'

/* eslint-disable */
import PropTypes from 'expose-loader?PropTypes!prop-types'
import ReactBootstrap from 'expose-loader?ReactBootstrap!react-bootstrap'
import ContentPickerWidget from 'expose-loader?BotpressContentPicker!~/components/Content/Select/Widget'
import { Provider } from 'react-redux'
/* eslint-enable */

import store from './store'

require('bootstrap/dist/css/bootstrap.css')
require('storm-react-diagrams/dist/style.min.css')
require('react-select/dist/react-select.css')
require('./theme.scss')

const token = getToken()
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token.token}`
}

const parseBotId = () => {
  const botIdRegex = /^\/studio\/(.+)?\//i
  const matches = window.location.pathname.match(botIdRegex)
  return (matches && matches[1]) || ''
}

if (axios && axios.defaults) {
  axios.defaults.headers.common['X-Botpress-App'] = 'Studio'
  axios.defaults.headers.common['X-Botpress-Bot-Id'] = parseBotId()
}

// Do not use "import App from ..." as hoisting will screw up styling
const App = require('./components/App').default

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('app')
)
