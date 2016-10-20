import React from 'react'
import pubsub from 'pubsub-js'
import HeaderRun from './Header.run'
import { NavDropdown, MenuItem } from 'react-bootstrap'

import NotificationHub from '../Notifications/Hub'

import { logout } from '../Authentication/auth'

class Header extends React.Component {
  componentDidMount() {
      HeaderRun()
  }

  toggleUserblock(e) {
    e.preventDefault()
    pubsub.publish('toggleUserblock')
  }

  renderLogoutButton() {
    if(!window.AUTH_ENABLED) {
      return null
    }

    return <li>
      <a href="#" onClick={logout}>
        <em className="fa fa-power-off"></em>
      </a>
    </li>
  }

  render() {
    const notifications = <NotificationHub skin={this.props.skin} />

    return (
    <header className="topnavbar-wrapper">
      { /* START Top Navbar */ }
      <nav role="navigation" className="navbar topnavbar">
        { /* START navbar header */ }
        <div className="navbar-header">
          <a href="/" className="navbar-brand">
            <div className="brand-logo">
              <img src="/img/logo.png" alt="App Logo" className="img-responsive" />
            </div>
          </a>
        </div>
        { /* END navbar header */ }
        { /* START Nav wrapper */ }
        <div className="nav-wrapper">
        { /* START Left navbar */ }
        <ul className="nav navbar-nav">
          <li>
            { /* Button to show/hide the sidebar on mobile. Visible on mobile only. */ }
            <a href="#" data-toggle-state="aside-toggled" data-no-persist="true" className="visible-xs sidebar-toggle">
              <em className="fa fa-navicon"></em>
            </a>
          </li>
        </ul>
        <ul className="nav navbar-nav navbar-right">
          <li>
            <a href="/logs">
              <em className="fa fa-file-text-o"></em>
            </a>
          </li>
          {notifications}
          {this.renderLogoutButton()}
        </ul>
        </div>
      </nav>
    </header>
    )
  }
}

export default Header
