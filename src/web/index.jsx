import React from 'expose-loader?React!react'
import ReactDOM from 'expose-loader?ReactDOM!react-dom'
import App from './components/App'

require('bootstrap/dist/css/bootstrap.css')
require('./theme.scss')

ReactDOM.render(<App />, document.getElementById('app'))
