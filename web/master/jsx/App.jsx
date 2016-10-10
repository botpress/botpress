import React from 'react'
import ReactDOM from 'react-dom'
import { Router, Route, Link, hashHistory, useRouterHistory, IndexRoute } from 'react-router'
import { createHistory } from 'history'

import initTranslation from './components/Common/localize'
import initLoadCss from './components/Common/load-css'

import Base from './components/Layout/Base'
import BasePage from './components/Layout/BasePage'
import BaseHorizontal from './components/Layout/BaseHorizontal'

import SingleView from './components/SingleView/SingleView'
import SubMenu from './components/SubMenu/SubMenu'

initTranslation()
initLoadCss()

// Disable warning "Synchronous XMLHttpRequest on the main thread is deprecated.."
$.ajaxPrefilter(function(options, originalOptions, jqXHR) {
  options.async = true
})

const appHistory = useRouterHistory(createHistory)({
  basename: '/'
})

ReactDOM.render(
  <Router history={appHistory}>
    <Route path="/" component={Base}>
      <IndexRoute component={SingleView} />
      <Route path="singleview" component={SingleView}/>
      <Route path="submenu" component={SubMenu}/>
    </Route>
    {/*<Route path="*" component={NotFound}/>*/}
  </Router>,
  document.getElementById('app')
);

// Auto close sidebar on route changes
appHistory.listen(function(ev) {
  $('body').removeClass('aside-toggled')
})
