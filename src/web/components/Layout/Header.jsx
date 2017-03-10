import React,{Component} from 'react'
import {
  Navbar, 
  Nav, 
  NavItem, 
  Glyphicon,
  MenuItem,
  NavDropdown
} from 'react-bootstrap'
import classnames from 'classnames'

import NotificationHub from '~/components/Notifications/Hub'
import { logout, getToken } from '~/util/Auth'

import style from './Header.scss'


const getProfileImgUrl = () => {
  const token = getToken()

  if (!token) {
    return null
  }

  //TODO: Remove and replace by the function to get the url from the token
  return "https://avatars2.githubusercontent.com/u/1315508?v=3"
}


class Header extends Component {

  renderLogoutButton() {
    if (!window.AUTH_ENABLED) {
      return null
    }

    const url = getProfileImgUrl()
    let label = <img src={url}></img>
    
    if (!url) {
      label = <i className="material-icons">account_circle</i>
    }
    
    return  <NavDropdown className={style.account} noCaret title={label} id="account-button">
      <MenuItem eventKey="1" onClick={logout}>Logout</MenuItem>
      <MenuItem eventKey="2">Dropdown link</MenuItem>
    </NavDropdown>
  }

  renderSlackButton() {
    return <span className={classnames(style.slack, 'bp-slack')} >
      <img src="/img/slack_mark.svg" />
    </span>
  }

  render() {
    const className = classnames(style.navbar, style['app-navbar'], 'bp-navbar')

    return <Navbar className={className}>
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
