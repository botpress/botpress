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
import Home from '~/views/Home'
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
        <Route path="home" component={Home}/>
        <IndexRoute component={Home}/>
        <Route path="modules/:moduleName" component={Module}/>
        <Route path="notifications" component={Notifications}/>
        <Route path="logs" component={Logs}/>
      </Route>
    </Router>
  )
}
