import React, { FC } from 'react'
import { Redirect, Route } from 'react-router-dom'
import BasicAuthentication from '~/auth/basicAuth'

interface Props {
  path: string
  component: any
  auth: BasicAuthentication
  children: React.ReactNode
}

const PrivateRoute: FC<Props> = ({ component: Component, auth, children, ...rest }) => (
  <Route
    {...rest}
    render={props =>
      auth.isAuthenticated() ? (
        <Component {...props} auth={auth}>
          {children}
        </Component>
      ) : (
        <Redirect to={{ pathname: '/login', state: { from: props.location } }} />
      )
    }
  />
)

export default PrivateRoute
