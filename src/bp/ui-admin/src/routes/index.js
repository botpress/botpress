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
import LicensePage from '../Pages/License'
import Landing from '../Pages/Landing'
import LandingStep2 from '../Pages/LandingStep2'
import UsersListPage from '../Pages/Users'

import Auth from '../Auth'
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
              <Route exact path="/license" render={props => <LicensePage {...props} />} />
              <Route
                exact
                from="/teams/:teamId"
                render={({ match }) => {
                  return <Redirect to={`/teams/${match.params.teamId}/bots`} />
                }}
              />
              <Route exact path="/teams" render={props => <TeamsListPage {...props} />} />
              <Route exact path="/teams/:teamId/bots" render={props => <TeamBotsPage {...props} />} />
              <Route exact path="/teams/:teamId/members" render={props => <TeamMembersPage {...props} />} />
              <Route exact path="/teams/:teamId/roles" render={props => <TeamRolesPage {...props} />} />
              <Route exact path="/users" render={props => <UsersListPage {...props} />} />
              <Redirect from="/" to="/teams" />
            </Switch>
          </PrivateRoute>
        </Switch>
      </ConnectedRouter>
    </Provider>
  )
}
