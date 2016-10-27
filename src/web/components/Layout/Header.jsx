import React,{Component} from 'react'
import {Navbar, Nav, NavItem, Glyphicon} from 'react-bootstrap'
import classnames from 'classnames'

import NotificationHub from '~/components/Notifications/Hub'
import { logout } from '~/util/Auth'

import style from './Header.scss'

class Header extends Component {

  renderLogoutButton() {
    if (!window.AUTH_ENABLED) {
      return null
    }

    return <li>
        <a href="#" onClick={logout}>
          <em className="glyphicon glyphicon-off"></em>
        </a>
    </li>
  }

  render() {
    const className = classnames(style.navbar, style['app-navbar'])

    return <Navbar inverse className={className}>
      <Navbar.Collapse>
        <Nav pullRight>
          <NavItem href="/logs"><Glyphicon glyph="list-alt"/></NavItem>
          <NotificationHub />
          {this.renderLogoutButton()}
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  }
}

export default Header
