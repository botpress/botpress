import { createBrowserHistory } from 'history'
import queryString from 'query-string'
import React from 'react'
import ReactGA from 'react-ga'
import { Router, Switch } from 'react-router-dom'
import EnsureAuthenticated from '~/components/Authentication'
import Layout from '~/components/Layout'

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
  if (window.SEND_USAGE_STATS) {
    logPageView()
  }
})

const logPageView = () => {
  let page = history.location.pathname
  // Strips the bot path param so we get unified data
  if (page.startsWith('/flows')) {
    page = '/flows'
  }
  ReactGA.set({ page })
  ReactGA.pageview(page)
}

export default () => {
  if (window.SEND_USAGE_STATS) {
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
