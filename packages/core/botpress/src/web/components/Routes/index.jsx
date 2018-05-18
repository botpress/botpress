import React from 'react'
import { Router, Route, Link, Switch } from 'react-router-dom'
import createBrowserHistory from 'history/createBrowserHistory'
import queryString from 'query-string'
import ReactGA from 'react-ga'

import EnsureAuthenticated from '~/components/Authentication'
import Layout from '~/components/Layout'
import Login from '~/views/Login'

// react-router doesn't do query parsing anymore since V4
// https://github.com/ReactTraining/react-router/issues/4410
const addLocationQuery = history => {
  history.location = Object.assign(history.location, {
    query: queryString.parse(history.location.search)
  })
}

const history = createBrowserHistory()
addLocationQuery(history)
history.listen(() => addLocationQuery(history))

const logPageView = () => {
  ReactGA.set({ page: window.location.pathname })
  ReactGA.pageview(window.location.pathname)
}

export default () => {
  if (!window.OPT_OUT_STATS) {
    ReactGA.initialize('UA-90044826-1')
  }
  const AuthenticatedLayout = EnsureAuthenticated(Layout)

  return (
    <Router history={history} onUpdate={logPageView}>
      <Switch>
        <Route exact path="/login" key="login-route" component={Login} />
        <AuthenticatedLayout />
      </Switch>
    </Router>
  )
}
