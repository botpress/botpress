import React from 'react'
import { Router, Route, Link, Switch } from 'react-router-dom'
import createBrowserHistory from 'history/createBrowserHistory'
import ReactGA from 'react-ga'

import EnsureAuthenticated from '~/components/Authentication'
import Layout from '~/components/Layout'
import AdditionnalRoutes from '+/views/Routes/index.jsx'

const history = createBrowserHistory()
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
        {AdditionnalRoutes.loginRoutes()}
        {AdditionnalRoutes.unsecuredRoutes()}
        <AuthenticatedLayout />
      </Switch>
    </Router>
  )
}
