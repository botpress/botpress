import 'babel-polyfill'
import React from 'expose-loader?React!react'
import ReactDOM from 'expose-loader?ReactDOM!react-dom'

import PropTypes from 'expose-loader?PropTypes!prop-types'
import ReactBootstrap from 'expose-loader?ReactBootstrap!react-bootstrap'
import { Provider } from 'react-redux'

import store from './store'

require('bootstrap/dist/css/bootstrap.css')
require('storm-react-diagrams/dist/style.min.css')
require('react-select/dist/react-select.css')
require('./theme.scss')

// Do not use "import App from ..." as hoisting will screw up styling
const App = require('./components/App').default

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('app')
)
