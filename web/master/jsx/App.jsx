import React from 'react'
import ReactDOM from 'react-dom'
import { Router, Route, Link, hashHistory, useRouterHistory, IndexRoute } from 'react-router'
import { createHistory } from 'history'

import EnsureAuthenticated from './components/Authentication/EnsureAuthenticated'

import LoginPage from './components/Authentication/Login'
import Base from './components/Layout/Base'
import ModuleView from './components/ModuleView'
import SingleView from './components/SingleView/SingleView'
import NotificationPage from './components/Notifications'
import LoggerView from './components/Logger'

import EventBus from './components/Common/EventBus'

import initLoadCss from './components/Common/load-css'
initLoadCss()

const appHistory = useRouterHistory(createHistory)({
  basename: '/'
})

appHistory.listen(function(ev) {
  $('body').removeClass('aside-toggled')
})

// Disable warning "Synchronous XMLHttpRequest on the main thread is deprecated.."
$.ajaxPrefilter(function(options, originalOptions, jqXHR) {
  options.async = true
})

EventBus.default.setup()
const skin = {
  events: EventBus.default
}

ReactDOM.render(<Router history={appHistory}>
  <Route path="/login" component={LoginPage} />
  <Route path="/" component={EnsureAuthenticated(Base)} skin={skin} >
    <IndexRoute component={SingleView} />
    <Route path="singleview" component={SingleView}/>
    <Route path="notifications" component={NotificationPage}/>
    <Route path="logs" component={LoggerView}/>
    <Route path="modules/:moduleName" component={ModuleView}/>
  </Route>
  {/*<Route path="*" component={NotFound}/>*/}
</Router>, document.getElementById('app'))
