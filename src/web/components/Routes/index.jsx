import React from 'react'
import {
  Router,
  Route,
  Link,
  hashHistory,
  useRouterHistory,
  IndexRoute
} from 'react-router'
import ReactGA from 'react-ga'
import { createHistory } from 'history'

import EnsureAuthenticated from '~/components/Authentication'
import Layout from '~/components/Layout'
import Dashboard from '~/views/Dashboard'
import Manage from '~/views/Manage'
import Middleware from '~/views/Middleware'
import Module from '~/views/Module'
import Notifications from '~/views/Notifications'
import Logs from '~/views/Logs'

import LoginRoutes from '+/views/Login/Routes.jsx'

import Admin from '+/views/Admin'
import Profile from '+/views/Profile'

const appHistory = useRouterHistory(createHistory)({ basename: '/' })

function logPageView() {
  ReactGA.set({ page: window.location.pathname })
  ReactGA.pageview(window.location.pathname)
}

export default () => {

  if (!window.OPT_OUT_STATS) {
    ReactGA.initialize('UA-90044826-1')
  }

  return (
    <Router history={appHistory} onUpdate={logPageView}>
      {LoginRoutes()}
      <Route path="/" component={EnsureAuthenticated(Layout)}>
        <Route path="dashboard" component={Dashboard}/>
        <IndexRoute component={Dashboard}/>
        <Route path="manage" component={Manage}/>
        <Route path="middleware" component={Middleware}/>
        <Route path="modules/:moduleName" component={Module}/>
        <Route path="notifications" component={Notifications}/>
        <Route path="logs" component={Logs}/>
        <Route path="admin" component={Admin}/>
        <Route path="profile" component={Profile}/>
      </Route>
    </Router>
  )
}
