import React from 'react'
import { Route, IndexRoute } from 'react-router'

import Login from '~/views/Login'

module.exports = extraRoutes => {
  return <Route path="/login">
    <IndexRoute component={Login}/>
    {extraRoutes}
  </Route>
}
