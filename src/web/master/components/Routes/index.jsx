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

import Layout from '~/components/Layout'
import Home from '~/views/Home'

const appHistory = useRouterHistory(createHistory)({basename: '/'})

appHistory.listen(function(ev) {
  // $('body').removeClass('aside-toggled') // TODO jQuery shit
})

export default (skin) => {
  return (
    <Router history={appHistory}>
      <Route path="/" component={Layout} skin={skin}>
        <IndexRoute component={Home}/>
      </Route>

      {/* <Route path="/login" component={LoginPage}/>
      <Route path="/" component={EnsureAuthenticated(Base)} skin={skin}>
        <IndexRoute component={Home}/>
        <Route path="home" component={Home}/>
        <Route path="notifications" component={NotificationPage}/>
        <Route path="logs" component={LoggerView}/>
        <Route path="modules/:moduleName" component={ModuleView}/>
      </Route> */}
    </Router>
  )
}
