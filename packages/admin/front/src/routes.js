import React from 'react'
import { Route, Switch, Redirect } from 'react-router-dom'
import { Provider } from 'react-redux'
import { ConnectedRouter } from 'react-router-redux'

import App from './App'

import LoginPage from './Pages/Login'
import CallbackGrantPage from './Pages/CallbackGrant'
import LoadingPage from './Pages/Loading'
import TeamBotsPage from './Pages/Teams/Bots'
import TeamsListPage from './Pages/Teams/List'
import TeamMembersPage from './Pages/Teams/Members'
import TeamRolesPage from './Pages/Teams/Roles'
import MeCliPage from './Pages/Me/Cli'

import { Provider as Auth } from './Auth'
import PrivateRoute from './PrivateRoute'

import store, { history } from './store'

const auth = new Auth()

const handleAuthentication = ({ location }) => {
  if (/access_token|id_token|error/.test(location.hash)) {
    auth.handleAuthentication()
  }
}

export const makeMainRoutes = () => {
  return (
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <Switch>
          <Route
            path="/login"
            render={props => {
              if (~~props.location.query.direct) {
                auth.login(props.location.query)
                return <LoadingPage {...props} />
              }

              return <LoginPage auth={auth} {...props} />
            }}
          />
          <Route
            exact
            path="/callback"
            render={props => {
              handleAuthentication(props)
              return <LoadingPage {...props} />
            }}
          />
          <PrivateRoute path="/callback-grant" auth={auth} component={props => props.children}>
            <Route
              exact
              path="/callback-grant"
              render={props => {
                return <CallbackGrantPage {...props} />
              }}
            />
          </PrivateRoute>
          <PrivateRoute path="/" auth={auth} component={App}>
            <Switch>
              <Route exact path="/me/cli" render={props => <MeCliPage {...props} />} />
              <Redirect from="/me" to="/me/cli" />
              <Route
                exact
                from="/teams/:teamId"
                render={({ match }) => {
                  return <Redirect to={`/teams/${match.params.teamId}/bots`} />
                }}
              />
              <Route exact path="/teams" render={props => <TeamsListPage {...props} />} />
              <Route exact path="/teams/join/:inviteCode" render={props => <TeamsListPage {...props} />} />
              <Route exact path="/teams/:teamId/bots" render={props => <TeamBotsPage {...props} />} />
              <Route exact path="/teams/:teamId/members" render={props => <TeamMembersPage {...props} />} />
              <Route exact path="/teams/:teamId/roles" render={props => <TeamRolesPage {...props} />} />
              <Redirect from="/" to="/teams" />
            </Switch>
          </PrivateRoute>
        </Switch>
      </ConnectedRouter>
    </Provider>
  )
}
