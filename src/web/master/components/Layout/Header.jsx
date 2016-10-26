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
