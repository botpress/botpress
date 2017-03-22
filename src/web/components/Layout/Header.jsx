import React,{Component} from 'react'
import {
  Navbar, 
  Nav, 
  NavItem, 
  Glyphicon,
  NavDropdown
} from 'react-bootstrap'
import classnames from 'classnames'

import { requireExtension } from '~/../extensions.js'

import { getToken, logout } from '~/util/Auth'

import ProfileMenu from '~/components/Profile/BasicMenu'

import style from './Header.scss'

const getProfileImgUrl = () => {
  const token = getToken()

  const encoded = token.token.replace(/\w+\./, '').replace(/\.[\w|\-|_]+/, '')
  
  const profile = JSON.parse(Buffer(encoded, 'base64').toString())

  if (!profile.imgUrl) {
    return null
  }

  return profile.imgUrl

  return null
}

class Header extends Component {

  renderLogoutButton() {

    const Menu = requireExtension('views/menu.jsx')
    
    if (!window.AUTH_ENABLED) {
      return null
    }

    const url = getProfileImgUrl()
    let label = <img src={url}></img>
    
    if (!url) {
      label = <i className="material-icons">account_circle</i>
    }
    
    return  <NavDropdown className={style.account} noCaret title={label} id="account-button">
      <Menu logout={logout}/>
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
