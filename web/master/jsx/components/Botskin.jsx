import React from 'react'
import ReactDOM from 'react-dom'
import { Router, Route, Link, hashHistory, useRouterHistory, IndexRoute } from 'react-router'
import { createHistory } from 'history'

import Base from './Layout/Base'
import ModuleView from './ModuleView'
import SingleView from './SingleView/SingleView'
import SubMenu from './SubMenu/SubMenu'

const appHistory = useRouterHistory(createHistory)({
  basename: '/'
})

appHistory.listen(function(ev) {
  $('body').removeClass('aside-toggled')
})

class Botskin extends React.Component {

  render() {
    const { modules } = this.props
    return <Router history={appHistory}>
      <Route path="/" component={Base}>
        <IndexRoute component={SingleView} />
        <Route path="singleview" component={SingleView}/>
        <Route path="submenu" component={SubMenu}/>
        <Route path="modules/:moduleName" component={ModuleView}/>
      </Route>
      {/*<Route path="*" component={NotFound}/>*/}
    </Router>
  }
}

export default Botskin
