import { Button } from '@blueprintjs/core'
import { auth as authentication } from 'botpress/shared'
import { ConnectedRouter } from 'connected-react-router'
import React from 'react'
import { Provider } from 'react-redux'
import { Redirect, Route, Switch } from 'react-router-dom'

import App from '~/app'
import store, { history } from '~/app/store'
import Auth, { getActiveWorkspace } from '~/auth/basicAuth'
import ChangePassword from '~/auth/ChangePassword'
import ChatAuthResult from '~/auth/ChatAuthResult'
import LoginPage from '~/auth/Login'
import LoginContainer from '~/auth/LoginContainer'
import RegisterPage from '~/auth/Register'
import Channels from '~/channels'
import Alerting from '~/health/alerting'
import Monitoring from '~/health/monitoring'
import Checklist from '~/management/checklist'
import Languages from '~/management/languages'
import LicenseStatus from '~/management/licensing'
import Modules from '~/management/modules'
import Versioning from '~/management/versioning'
import LatestReleases from '~/releases/LatestReleases'
import Bots from '~/workspace/bots'
import Collaborators from '~/workspace/collaborators'
import Logs from '~/workspace/logs'
import Roles from '~/workspace/roles'
import Workspaces from '~/workspace/workspaces'

import AppLoader from '../InjectedModuleView/AppLoader'
import { extractCookie } from './cookies'
import PrivateRoute from './PrivateRoute'
import SegmentHandler from './SegmentHandler'

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
    const userToken = extractCookie('userToken')
    const tokenExpiry = extractCookie('tokenExpiry')

    if (userToken) {
      authentication.setToken({
        [window.USE_JWT_COOKIES ? 'csrf' : 'jwt']: userToken,
        exp: Date.now() + Number(tokenExpiry)
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
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
    <Provider store={store}>
      <SegmentHandler>
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
                <Route path="/server/license" component={LicenseStatus} />
                <Route path="/server/alerting" component={Alerting} />
                <Route path="/channels" component={Channels} />
                <Route path="/workspace/:workspaceId?/bots" component={Bots} />
                <Route path="/workspace/:workspaceId?/users" component={Collaborators} />
                <Route path="/workspace/:workspaceId?/roles" component={Roles} />
                <Route path="/workspace/:workspaceId?/logs" component={Logs} />
                <Route path="/workspaces" component={Workspaces} />
                <Route path="/apps/:appName/:botId?" component={AppLoader} />
                <Route path="/modules" component={Modules} />
                <Route path="/" render={() => <Redirect from="/" to={`/workspace/${getActiveWorkspace()}/bots`} />} />
              </Switch>
            </PrivateRoute>
          </Switch>
        </ConnectedRouter>
      </SegmentHandler>
    </Provider>
  )
}
