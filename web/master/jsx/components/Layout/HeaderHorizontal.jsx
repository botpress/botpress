import React from 'react';
import pubsub from 'pubsub-js';
import HeaderRun from './Header.run'
import { NavDropdown, MenuItem, NavItem } from 'react-bootstrap';
import { Router, Route, Link, History } from 'react-router';
import { LinkContainer } from 'react-router-bootstrap';

class HeaderHorizontal extends React.Component {

    componentDidMount() {

        HeaderRun();
    }

    toggleUserblock(e) {
        e.preventDefault();
        pubsub.publish('toggleUserblock');
    }

    render() {
        const ddAlertTitle = (
            <span>
                <em className="icon-bell"></em>
                <span className="label label-danger">11</span>
            </span>
        )

        return (
            <header className="topnavbar-wrapper">
                { /* START Top Navbar */ }
                <nav role="navigation" className="navbar topnavbar">
                    { /* START navbar header */ }
                    <div className="navbar-header">
                        <a href="#/" className="navbar-brand">
                            <div className="brand-logo">
                                <img src="img/logo.png" alt="App Logo" className="img-responsive" />
                            </div>
                            <div className="brand-logo-collapsed">
                                <img src="img/logo-single.png" alt="App Logo" className="img-responsive" />
                            </div>
                        </a>
                    </div>
                    { /* END navbar header */ }
                    { /* START Nav wrapper */ }
                    <div className="navbar-collapse collapse">
                        { /* START Left navbar */ }
                        <ul className="nav navbar-nav">
                            <NavDropdown noCaret eventKey={ 3 } title="Dashboard" id="dashboard-nav-dropdown">
                                <LinkContainer to="dashboardv1h">
                                    <MenuItem className="animated fadeIn" eventKey={ 3.1 }>Dashboard v1</MenuItem>
                                </LinkContainer>
                                <LinkContainer to="dashboardv2h">
                                    <MenuItem className="animated fadeIn" eventKey={ 3.2 }>Dashboard v2</MenuItem>
                                </LinkContainer>
                                <LinkContainer to="dashboardv3h">
                                    <MenuItem className="animated fadeIn" eventKey={ 3.3 }>Dashboard v3</MenuItem>
                                </LinkContainer>
                            </NavDropdown>
                            <LinkContainer to="widgetsh"><NavItem>Widgets</NavItem></LinkContainer>
                            <LinkContainer to="dashboard"><NavItem>Back</NavItem></LinkContainer>
                        </ul>
                        { /* END Left navbar */ }
                        { /* START Right Navbar */ }
                        <ul className="nav navbar-nav navbar-right">
                            { /* Search icon */ }
                            <li>
                                <a href="#" data-search-open="">
                                    <em className="icon-magnifier"></em>
                                </a>
                            </li>
                            { /* Fullscreen (only desktops) */ }
                            <li className="visible-lg">
                                <a href="#" data-toggle-fullscreen="">
                                    <em className="fa fa-expand"></em>
                                </a>
                            </li>
                            { /* START Alert menu */ }
                            <NavDropdown noCaret eventKey={ 3 } title={ ddAlertTitle } id="basic-nav-dropdown">
                                <MenuItem className="animated flipInX" eventKey={ 3.1 }>Login</MenuItem>
                                <MenuItem className="animated flipInX" eventKey={ 3.2 }>Profile</MenuItem>
                                <MenuItem className="animated flipInX" eventKey={ 3.3 }>Dashboard</MenuItem>
                                <MenuItem divider />
                                <MenuItem className="animated flipInX" eventKey={ 3.3 }>Logout</MenuItem>
                            </NavDropdown>
                            { /* END Alert menu */ }
                            { /* START Offsidebar button */ }
                            <li>
                                <a href="#" data-toggle-state="offsidebar-open" data-no-persist="true">
                                    <em className="icon-notebook"></em>
                                </a>
                            </li>
                            { /* END Offsidebar menu */ }
                        </ul>
                        { /* END Right Navbar */ }
                    </div>
                    { /* END Nav wrapper */ }
                    { /* START Search form */ }
                    <form role="search" action="search.html" className="navbar-form">
                        <div className="form-group has-feedback">
                            <input type="text" placeholder="Type and hit enter ..." className="form-control" />
                            <div data-search-dismiss="" className="fa fa-times form-control-feedback"></div>
                        </div>
                        <button type="submit" className="hidden btn btn-default">Submit</button>
                    </form>
                    { /* END Search form */ }
                </nav>
                { /* END Top Navbar */ }
            </header>
            );
    }

}

export default HeaderHorizontal;
