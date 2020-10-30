import { Button } from '@blueprintjs/core'
import React from 'react'
import { Provider } from 'react-redux'
import { Redirect, Route, Switch } from 'react-router-dom'
import { ConnectedRouter } from 'react-router-redux'
import ChatAuthResult from '~/Pages/Account/ChatAuthResult'
import Details from '~/Pages/Bot/Details'
import { LoginContainer } from '~/Pages/Layouts/LoginContainer'
import Logs from '~/Pages/Logs'
import Alerting from '~/Pages/Server/Alerting'
import Checklist from '~/Pages/Server/Checklist'
import Languages from '~/Pages/Server/Languages'
import LatestReleases from '~/Pages/Server/LatestReleases'
import LicenseStatus from '~/Pages/Server/LicenseStatus'
import Monitoring from '~/Pages/Server/Monitoring'
import Versioning from '~/Pages/Server/Versioning'
import Bots from '~/Pages/Workspace/Bots'
import Roles from '~/Pages/Workspace/Roles'
import Collaborators from '~/Pages/Workspace/Users/Collaborators'
import Workspaces from '~/Pages/Workspaces'

import store, { history } from '../store'
import { extractCookie } from '../utils/cookies'
import App from '../App/Layout'
import Auth, { getActiveWorkspace, setToken } from '../Auth'
import ChangePassword from '../Pages/Account/ChangePassword'
import LoginPage from '../Pages/Account/Login'
import RegisterPage from '../Pages/Account/Register'
import Debug from '../Pages/Server/Debug'
import Modules from '../Pages/Server/Modules'

import PrivateRoute from './PrivateRoute'

const setupBranding = () => {
  window.document.title = window.APP_NAME || 'Botpress Admin Panel'

  if (window.APP_FAVICON) {
    const link = document.querySelector('link[rel="icon"]')
    link && link.setAttribute('href', window.APP_FAVICON)
  }

  if (window.APP_CUSTOM_CSS) {
    const sheet = document.createElement('link')
    sheet.rel = 'stylesheet'
    sheet.href = window.APP_CUSTOM_CSS
    sheet.type = 'text/css'
    document.head.appendChild(sheet)
  }
}

export const makeMainRoutes = () => {
  const auth = new Auth()
  setupBranding()

  const ExtractToken = () => {
    const token = extractCookie('userToken')
    if (token) {
      setToken(token)
    }

    // tslint:disable-next-line: no-floating-promises
    auth.afterLoginRedirect()

    return null
  }

  const NoAccess = () => {
    return (
      <LoginContainer subtitle={<strong>No access</strong>}>
        <p>Sorry, you do not have access to any workspace.</p>
        <Button text="Logout" onClick={auth.logout} />
      </LoginContainer>
    )
  }

  return (
    <Provider store={store as any}>
      <ConnectedRouter history={history}>
        <Switch>
          <Route path="/login/:strategy?/:workspace?" render={props => <LoginPage auth={auth} {...props} />} />
          <Route path="/register/:strategy?/:workspace?" render={props => <RegisterPage auth={auth} {...props} />} />
          <Route path="/setToken" component={ExtractToken} />
          <Route path="/changePassword" render={props => <ChangePassword auth={auth} {...props} />} />
          <Route path="/noAccess" component={NoAccess} />
          <Route path="/chatAuthResult" component={ChatAuthResult} />
          <PrivateRoute path="/" auth={auth} component={App}>
            <Switch>
              <Route path="/checklist" component={Checklist} />
              <Route path="/latestReleases" component={LatestReleases} />
              <Route path="/server/monitoring" component={Monitoring} />
              <Route path="/server/version" component={Versioning} />
              <Route path="/server/languages" component={Languages} />
              <Route path="/server/debug" component={Debug} />
              <Route path="/server/license" component={LicenseStatus} />
              <Route path="/server/alerting" component={Alerting} />
              <Route path="/workspace/:workspaceId?/bots/:botId" component={Details} />
              <Route path="/workspace/:workspaceId?/bots" component={Bots} />
              <Route path="/workspace/:workspaceId?/users" component={Collaborators} />
              <Route path="/workspace/:workspaceId?/roles" component={Roles} />
              <Route path="/workspace/:workspaceId?/logs" component={Logs} />
              <Route path="/workspaces" component={Workspaces} />
              <Route path="/debug" component={Debug} />
              <Route path="/modules" component={Modules} />
              <Route path="/" render={() => <Redirect from="/" to={`/workspace/${getActiveWorkspace()}/bots`} />} />
            </Switch>
          </PrivateRoute>
        </Switch>
      </ConnectedRouter>
    </Provider>
  )
}
