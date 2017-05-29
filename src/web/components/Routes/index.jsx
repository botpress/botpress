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
import UMM from '~/views/UMM'
import Module from '~/views/Module'
import Notifications from '~/views/Notifications'
import Logs from '~/views/Logs'

import AdditionnalRoutes from '+/views/Routes/index.jsx'

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
      {AdditionnalRoutes.addLoginRoutes()}
      {AdditionnalRoutes.addUnsecuredRoutes()}
      <Route path="/" component={EnsureAuthenticated(Layout)}>
        <Route path="dashboard" component={Dashboard}/>
        <IndexRoute component={Dashboard}/>
        <Route path="manage" component={Manage}/>
        <Route path="middleware" component={Middleware}/>
        <Route path="umm" component={UMM}/>
        <Route path="modules/:moduleName(/:subView)" component={Module}/>
        <Route path="notifications" component={Notifications}/>
        <Route path="logs" component={Logs}/>
        {AdditionnalRoutes.addSecuredRoutes()}
      </Route>
    </Router>
  )
}
