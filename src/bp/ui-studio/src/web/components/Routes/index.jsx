import React from 'react'
import { Router, Switch } from 'react-router-dom'
import createBrowserHistory from 'history/createBrowserHistory'
import queryString from 'query-string'
import ReactGA from 'react-ga'

import EnsureAuthenticated from '~/components/Authentication'
import Layout from '~/components/Layout'

const sendStats = !window.OPT_OUT_STATS

// react-router doesn't do query parsing anymore since V4
// https://github.com/ReactTraining/react-router/issues/4410
const addLocationQuery = history => {
  history.location = Object.assign(history.location, {
    query: queryString.parse(history.location.search)
  })
}

const history = createBrowserHistory({ basename: window.BP_BASE_PATH + '/' })
addLocationQuery(history)
history.listen(() => {
  addLocationQuery(history)
  if (sendStats) {
    logPageView()
  }
})

const logPageView = () => {
  ReactGA.set({ page: history.location.pathname })
  ReactGA.pageview(history.location.pathname)
}

export default () => {
  if (sendStats) {
    ReactGA.initialize(window.ANALYTICS_ID, {
      gaOptions: {
        userId: window.UUID
      }
    })
  }
  const AuthenticatedLayout = EnsureAuthenticated(Layout)

  return (
    <Router history={history}>
      <Switch>
        <AuthenticatedLayout />
      </Switch>
    </Router>
  )
}
