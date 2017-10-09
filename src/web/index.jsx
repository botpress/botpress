import React from 'expose?React!react'
import ReactDOM from 'expose?ReactDOM!react-dom'

require('bootstrap/dist/css/bootstrap.css')
require('storm-react-diagrams/dist/style.css')
require('./theme.scss')
var App = require('./components/App').default

ReactDOM.render(<App />, document.getElementById('app'))
