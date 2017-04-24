import React from 'react'
import { Route, IndexRoute } from 'react-router'

import Login from '~/views/Login'

const addSecuredRoutes = (extraRoutes) => {
	return <Route path="/">
		{extraRoutes}
	</Route>
}

const addLoginRoutes = (extraRoutes) => {
  return <Route path="/login">
    <IndexRoute component={Login}/>
    {extraRoutes}
  </Route>
}

const addUnsecuredRoutes = (extraRoutes) => {
	return <Route path="/unsecured">
		{extraRoutes}
	</Route>
}

module.exports = {
	addSecuredRoutes,
	addUnsecuredRoutes,
	addLoginRoutes
}