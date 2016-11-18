import React from 'react'
import {
  Router,
  Route,
  Link,
  hashHistory,
  useRouterHistory,
  IndexRoute
} from 'react-router'
import {createHistory} from 'history'

import EnsureAuthenticated from '~/components/Authentication'
import Layout from '~/components/Layout'
import Dashboard from '~/views/Dashboard'
import Manage from '~/views/Manage'
import Module from '~/views/Module'
import Notifications from '~/views/Notifications'
import Logs from '~/views/Logs'
import Login from '~/views/Login'

const appHistory = useRouterHistory(createHistory)({basename: '/'})

export default () => {
  return (
    <Router history={appHistory}>
      <Route path="/login" component={Login}/>
      <Route path="/" component={EnsureAuthenticated(Layout)}>
        <Route path="dashboard" component={Dashboard}/>
        <IndexRoute component={Dashboard}/>
        <Route path="manage" component={Manage}/>
        <Route path="modules/:moduleName" component={Module}/>
        <Route path="notifications" component={Notifications}/>
        <Route path="logs" component={Logs}/>
      </Route>
    </Router>
  )
}
