import React from 'react'
import ReactDOM from 'react-dom'
import { Router, Route, Link, hashHistory, useRouterHistory, IndexRoute } from 'react-router'
import { createHistory } from 'history'

import Base from './Layout/Base'
import ModuleView from './ModuleView'
import SingleView from './SingleView/SingleView'
import NotificationPage from './Notifications'

import EventBus from './Common/EventBus'

const appHistory = useRouterHistory(createHistory)({
  basename: '/'
})

appHistory.listen(function(ev) {
  $('body').removeClass('aside-toggled')
})

class Botskin extends React.Component {

  constructor(props) {
    super(props)
    EventBus.default.start()
    this.events = EventBus.default
  }

  render() {
    const { modules } = this.props
    return <Router history={appHistory}>
      <Route path="/" component={Base} skin={this}>
        <IndexRoute component={SingleView} />
        <Route path="singleview" component={SingleView}/>
        <Route path="notifications" component={NotificationPage}/>
        <Route path="modules/:moduleName" component={ModuleView}/>
      </Route>
      {/*<Route path="*" component={NotFound}/>*/}
    </Router>
  }
}

export default Botskin
