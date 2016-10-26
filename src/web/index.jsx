import React from 'react'
import ReactDOM from 'react-dom'

require("bootstrap/dist/css/bootstrap.css")
var App = require('./components/App').default

// import EnsureAuthenticated from './components/Authentication/EnsureAuthenticated'
//
// import LoginPage from './components/Authentication/Login'
// import Base from './components/Layout/Base'
// import ModuleView from './components/ModuleView'
// import Home from './components/Home'
// import NotificationPage from './components/Notifications'
// import LoggerView from './components/Logger'

ReactDOM.render(<App />, document.getElementById('app'))
