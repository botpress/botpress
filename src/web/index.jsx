import 'babel-polyfill'
import React from 'expose-loader?React!react'
import ReactDOM from 'expose-loader?ReactDOM!react-dom'
import { Provider } from 'react-redux'

import reducers from './reducers' // App won't load without importing it here
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
