import React from 'react'
import {Navbar, Nav, NavItem, NavDropdown, MenuItem, Glyphicon} from 'react-bootstrap'
import {Link} from 'react-router'

import NotificationHub from '~/components/Notifications/Hub'
import { logout } from '~/util/Auth'

import style from './Header.scss'

class Header extends React.Component {

  renderLogoutButton() {
    if (!window.AUTH_ENABLED) {
      return null
    }

    return (<li>
        <a href="#" onClick={logout}>
          <em className="glyphicon glyphicon-off"></em>
        </a>
    </li>)
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
          <li role="presentation">
            <Link to="/logs">
                <Glyphicon glyph="list-alt"/>
            </Link>
          </li>
          <NotificationHub />
          {this.renderLogoutButton()}
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  }
}

export default Header
