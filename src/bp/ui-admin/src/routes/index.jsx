import React from 'react'
import { Route, Switch, Redirect } from 'react-router-dom'
import { Provider } from 'react-redux'
import { ConnectedRouter } from 'react-router-redux'

import App from '../App/Layout'

import LoginPage from '../Pages/Login'
import RegisterPage from '../Pages/Account/Register'
import ChangePassword from '../Pages/Account/ChangePassword'
import Landing from '../Pages/Landing'

import Auth from '../Auth'
import { logout as logoutLicensing } from '../Auth/licensing'
import PrivateRoute from './PrivateRoute'
import store, { history } from '../store'
import { extractCookie } from '../utils/cookies'

import ServerSettings from '../Pages/ServerSettings'
import Workspace from '../Pages/Workspace'
import MyAccount from '../Pages/MyAccount'

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
          <Route path="/login" render={props => <LoginPage auth={auth} {...props} />} />
          <Route path="/register" render={props => <RegisterPage auth={auth} {...props} />} />
          <Route
            path="/setToken"
            render={() => {
              auth.setSession({ expiresIn: 7200, idToken: extractCookie('userToken') })
              return <Redirect to="/" />
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
              <Route exact path="/profile" render={props => <MyAccount {...props} />} />
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
              <Route path="/workspace" component={Workspace} />
              <Route exact path="/settings" component={ServerSettings} />

              <Redirect from="/" to="/workspace" />
            </Switch>
          </PrivateRoute>
        </Switch>
      </ConnectedRouter>
    </Provider>
  )
}
