import React,{Component} from 'react'
import {
  Navbar, 
  Nav, 
  NavItem, 
  Glyphicon,
  MenuItem,
  DropdownButton
} from 'react-bootstrap'
import classnames from 'classnames'

import NotificationHub from '~/components/Notifications/Hub'
import { logout } from '~/util/Auth'

import style from './Header.scss'

class Header extends Component {

  renderLogoutButton() {
    if (!window.AUTH_ENABLED) {
      return null
    }

    const label = <i className="material-icons">account_circle</i>

    return  <DropdownButton className={style.account} noCaret title={label}>
      <MenuItem eventKey="1">
        <a className={style.account} href="#" onClick={logout}>
          Logout
        </a>
      </MenuItem>
      <MenuItem eventKey="2">Dropdown link</MenuItem>
    </DropdownButton>
  }

  renderSlackButton() {
    return <span className={classnames(style.slack, 'bp-slack')} >
      <img src="/img/slack_mark.svg" />
    </span>
  }

  render() {
    const className = classnames(style.navbar, style['app-navbar'], 'bp-navbar')

    return <Navbar inverse className={className}>
      <Navbar.Collapse>
        <Nav pullRight>
          <NavItem href="https://slack.botpress.io" target="_blank">{this.renderSlackButton()}</NavItem>
          <NavItem href="/logs"><Glyphicon glyph="list-alt"/></NavItem>
          <NotificationHub />
          {this.renderLogoutButton()}
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  }
}

export default Header
