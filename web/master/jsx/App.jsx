/*!
 *
 * Angle - Bootstrap Admin App + ReactJS
 *
 * Version: 3.5
 * Author: @themicon_co
 * Website: http://themicon.co
 * License: https://wrapbootstrap.com/help/licenses
 *
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Link, hashHistory, useRouterHistory, IndexRoute } from 'react-router';
import { createHistory } from 'history';

import initTranslation from './components/Common/localize';
import initLoadCss from './components/Common/load-css';

import Base from './components/Layout/Base';
import BasePage from './components/Layout/BasePage';
import BaseHorizontal from './components/Layout/BaseHorizontal';

import SingleView from './components/SingleView/SingleView';
import SubMenu from './components/SubMenu/SubMenu';


// Init translation system
initTranslation();
// Init css loader (for themes)
initLoadCss();

// Disable warning "Synchronous XMLHttpRequest on the main thread is deprecated.."
$.ajaxPrefilter(function(options, originalOptions, jqXHR) {
    options.async = true;
});

// specify basename below if running in a subdirectory or set as "/" if app runs in root
const appHistory = useRouterHistory(createHistory)({
  basename: '/'
})

ReactDOM.render(
    <Router history={appHistory}>
        <Route path="/" component={Base}>

            {/* Default route*/}
            <IndexRoute component={SingleView} />

            <Route path="singleview" component={SingleView}/>
            <Route path="submenu" component={SubMenu}/>

        </Route>

        {/* Not found handler */}
        {/*<Route path="*" component={NotFound}/>*/}

    </Router>,
    document.getElementById('app')
);

// Auto close sidebar on route changes
appHistory.listen(function(ev) {
    $('body').removeClass('aside-toggled');
});
