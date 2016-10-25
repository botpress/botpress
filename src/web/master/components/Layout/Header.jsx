import React from 'react'
import {Navbar, Nav, NavItem, NavDropdown, MenuItem} from 'react-bootstrap'

const style = require('./Header.scss')

// import NotificationHub from '../Notifications/Hub' // TODO
// import { logout } from '../Authentication/auth'

class Header extends React.Component {

  renderLogoutButton() {
    if (!window.AUTH_ENABLED) {
      return null
    }

    return <li>
      {/* TODO */}
      <a href="#">
        {/* <a href="#" onClick={logout}> */}
        <em className="fa fa-power-off"></em>
      </a>
    </li>
  }

  render() {
    return <Navbar inverse className={style.navbar}>
      <Navbar.Collapse>
        <Nav>
          <NavItem eventKey={1} href="#">Link</NavItem>
          <NavItem eventKey={2} href="#">Link</NavItem>
          <NavDropdown eventKey={3} title="Dropdown" id="basic-nav-dropdown">
            <MenuItem eventKey={3.1}>Action</MenuItem>
            <MenuItem eventKey={3.2}>Another action</MenuItem>
            <MenuItem eventKey={3.3}>Something else here</MenuItem>
            <MenuItem divider/>
            <MenuItem eventKey={3.3}>Separated link</MenuItem>
          </NavDropdown>
        </Nav>
        <Nav pullRight>
          <NavItem eventKey={1} href="#">Link Right</NavItem>
          <NavItem eventKey={2} href="#">Link Right</NavItem>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  }

  render2() {
    // const notifications = <NotificationHub skin={this.props.skin} />

    return (
      <header className="topnavbar-wrapper">
        {/* START Top Navbar */}
        <nav role="navigation" className="navbar topnavbar">
          {/* START navbar header */}
          <div className="navbar-header">
            <a href="/" className="navbar-brand">
              <div className="brand-logo">

              </div>
            </a>
          </div>
          {/* END navbar header */}
          {/* START Nav wrapper */}
          <div className="nav-wrapper">
            {/* START Left navbar */}
            <ul className="nav navbar-nav">
              <li>
                {/* Button to show/hide the sidebar on mobile. Visible on mobile only. */}
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
              {/* {notifications} */}
              {/* TODO */}
              {this.renderLogoutButton()}
            </ul>
          </div>
        </nav>
      </header>
    )
  }
}

export default Header
