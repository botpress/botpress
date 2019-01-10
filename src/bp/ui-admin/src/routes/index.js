import React from 'react'
import { Route, Switch, Redirect } from 'react-router-dom'
import { Provider } from 'react-redux'
import { ConnectedRouter } from 'react-router-redux'

import App from '../App'

import LoginPage from '../Pages/Login'
import TeamBotsPage from '../Pages/Teams/Bots'
import TeamsListPage from '../Pages/Teams/List'
import TeamMembersPage from '../Pages/Teams/Members'
import TeamRolesPage from '../Pages/Teams/Roles'
import ProfilePage from '../Pages/Account/Profile'
import ChangePassword from '../Pages/Account/ChangePassword'

import Landing from '../Pages/Landing'
import LandingStep2 from '../Pages/LandingStep2'
import UsersListPage from '../Pages/Users'
import LicensingStatus from '../Pages/Licensing/Status'
import LicensingLogin from '../Pages/Licensing/Login'
import LicensingKeys from '../Pages/Licensing/Keys'
import LicensingBuy from '../Pages/Licensing/Buy'
import LicensingRegister from '../Pages/Licensing/Register'

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
              <Route exact path="/teams" render={props => <TeamsListPage {...props} />} />
              <Route exact path="/teams/:teamId/bots" render={props => <TeamBotsPage {...props} />} />
              <Route exact path="/teams/:teamId/members" render={props => <TeamMembersPage {...props} />} />
              <Route exact path="/teams/:teamId/roles" render={props => <TeamRolesPage {...props} />} />
              <Route exact path="/users" render={props => <UsersListPage {...props} />} />
              <Route exact path="/licensing" render={props => <LicensingStatus {...props} />} />
              <Route exact path="/licensing/register" render={props => <LicensingRegister {...props} />} />
              <Route exact path="/licensing/login" render={props => <LicensingLogin {...props} />} />
              <Route exact path="/licensing/keys" render={props => <LicensingKeys {...props} />} />
              <Route exact path="/licensing/buy" render={props => <LicensingBuy {...props} />} />
              <Redirect from="/" to="/teams" />
            </Switch>
          </PrivateRoute>
        </Switch>
      </ConnectedRouter>
    </Provider>
  )
}
