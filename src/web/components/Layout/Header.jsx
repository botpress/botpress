import React, { Component } from 'react'
import {
  Navbar, 
  Nav, 
  NavItem, 
  Glyphicon,
  NavDropdown
} from 'react-bootstrap'

import classnames from 'classnames'
import axios from 'axios'

import NotificationHub from '~/components/Notifications/Hub'
import ProfileMenu from '+/views/ProfileMenu'

import { getCurrentUser, logout } from '~/util/Auth'

import style from './Header.scss'

class Header extends Component {

  constructor(props) {
    super(props)

    this.state = {
      loading: true
    }
  }

  componentDidMount() {
    const user = getCurrentUser()

    if (!this.isLiteAdmin(user)) {
      this.fetchProfile()
    }
  }

  isLiteAdmin(user) {
    if (user && user.id === 0 && user.email === 'admin@botpress.io') {
      return true
    }
    return false
  }

  getProfileImgUrl() {
    return this.state.avatarURL ? '/api/enterprise/accounts/avatars/' + this.state.avatarURL : null
  }

  fetchProfile() {
    return axios.get('/api/enterprise/my-account')
    .then(res => {
      this.setState({
        ...res.data,
        loading: false
      })
    })
    .catch(err => {
      this.setState({
        error: "An error occured while fetching the profile: " + err,
        loading: false
      })
    })
  }

  renderLogoutButton() {
    
    if (!window.AUTH_ENABLED) {
      return null
    }

    const url = this.getProfileImgUrl()
    let label = <img src={url}></img>
    
    if (!url) {
      label = <i className="material-icons">account_circle</i>
    }
    
    return <NavDropdown className={style.account} noCaret title={label} id="account-button">
      <ProfileMenu logout={logout}/>  
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
