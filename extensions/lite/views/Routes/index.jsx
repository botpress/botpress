import React from 'react'
import { Route } from 'react-router-dom'

import Login from '~/views/Login'

module.exports = {
  securedRoutes: () => [],
  unsecuredRoutes: () => [<Route exact path="/login" key="login-route" component={Login} />],
  loginRoutes: () => []
}
