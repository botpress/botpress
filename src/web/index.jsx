import React from 'expose-loader?React!react'
import ReactDOM from 'expose-loader?ReactDOM!react-dom'

require('bootstrap/dist/css/bootstrap.css')
require('./theme.scss')

// Don't use `import` for App as hosting will mess us the styling import ordering
const App = require('./components/App')

ReactDOM.render(<App />, document.getElementById('app'))
