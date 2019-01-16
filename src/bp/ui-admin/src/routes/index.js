import React from 'react'
import { Route, Switch, Redirect } from 'react-router-dom'
import { Provider } from 'react-redux'
import { ConnectedRouter } from 'react-router-redux'

import App from '../App'

import LoginPage from '../Pages/Login'
import BotsPage from '../Pages/Bots'
import ProfilePage from '../Pages/Account/Profile'
import ChangePassword from '../Pages/Account/ChangePassword'

import Landing from '../Pages/Landing'
import LandingStep2 from '../Pages/LandingStep2'
import UsersListPage from '../Pages/Users'
import LicensingStatus from '../Pages/Licensing/Status'
import LicensingLogin from '../Pages/Licensing/Login'
import LicensingKeys from '../Pages/Licensing/Keys'
import LicensingRegister from '../Pages/Licensing/Register'
import VersioningPage from '../Pages/Versioning'

import Auth from '../Auth'
import { logout as logoutLicensing } from '../Auth/licensing'
import PrivateRoute from './PrivateRoute'
import store, { history } from '../store'

export const makeMainRoutes = () => {
  const auth = new Auth()

  return (
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <Switch>
          <Route
            path="/landing"
            render={props => {
              return <Landing />
            }}
          />
          <Route
            path="/landingstep2"
            render={props => {
              return <LandingStep2 />
            }}
          />
          <Route
            path="/login"
            render={props => {
              return <LoginPage auth={auth} {...props} />
            }}
          />
          <Route
            path="/changePassword"
            render={props => {
              return <ChangePassword auth={auth} {...props} />
            }}
          />
          <PrivateRoute path="/" auth={auth} component={App}>
            <Switch>
              <Route exact path="/profile" render={props => <ProfilePage {...props} />} />
              <Route
                exact
                from="/teams/:teamId"
                render={({ match }) => {
                  return <Redirect to={`/teams/${match.params.teamId}/bots`} />
                }}
              />
              <Route
                exact
                path="/licensing/logout"
                render={() => {
                  logoutLicensing()
                  return <Redirect to={{ pathname: '/licensing' }} />
                }}
              />
              <Route exact path="/bots" render={props => <BotsPage {...props} />} />
              <Route exact path="/users" render={props => <UsersListPage {...props} />} />
              <Route exact path="/licensing" render={props => <LicensingStatus {...props} />} />
              <Route exact path="/licensing/register" render={props => <LicensingRegister {...props} />} />
              <Route exact path="/licensing/login" render={props => <LicensingLogin {...props} />} />
              <Route exact path="/licensing/keys" render={props => <LicensingKeys {...props} />} />
              <Route exact path="/versioning" render={props => <VersioningPage {...props} />} />
              <Redirect from="/" to="/bots" />
            </Switch>
          </PrivateRoute>
        </Switch>
      </ConnectedRouter>
    </Provider>
  )
}
