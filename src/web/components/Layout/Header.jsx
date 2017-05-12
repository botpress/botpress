import React, { Component } from 'react'
import PropTypes from 'prop-types'

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
import RulesChecker from '+/views/RulesChecker'

import { getCurrentUser, logout } from '~/util/Auth'

import style from './Header.scss'

import { connect } from 'nuclear-js-react-addons'
import getters from '~/stores/getters'
import actions from '~/actions'

@connect(props => ({ 
  user: getters.user,
  UI: getters.UI
}))

class Header extends Component {

  constructor(props, context) {
    super(props, context)

    this.state = {
      loading: true
    }
  }

  getProfileImgUrl() {
    if (!this.props.user.get('avatarURL')) {
      return null
    }
    return '/api/enterprise/accounts/avatars/' + this.props.user.get('avatarURL')
  }

  handleFullscreen() {
    const newViewMode = this.props.UI.get('viewMode') < 1 ? 1 : 0
    actions.viewModeChanged(newViewMode)
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

  renderFullScreenButton() {
    return <span className={classnames(style.fullScreen, 'bp-full-screen')} >
      <Glyphicon glyph="fullscreen"/>
    </span>
  }

  renderSlackButton() {
    return <span className={classnames(style.slack, 'bp-slack')} >
      <img src="/img/slack_mark.svg" />
    </span>
  }

  render() {
    if (this.props.UI.get('viewMode') >= 3) {
      return null
    }

    const classNames = classnames(style.navbar, style['app-navbar'], 'bp-navbar')

    return <Navbar className={classNames}>
      <Navbar.Collapse>
        <Nav pullRight>
          <NavItem href="https://slack.botpress.io" target="_blank">{this.renderSlackButton()}</NavItem>
          <NavItem onClick={::this.handleFullscreen}>{this.renderFullScreenButton()}</NavItem>
          <RulesChecker res='bot/logs' op='read'>
            <NavItem href="/logs"><Glyphicon glyph="list-alt"/></NavItem>
          </RulesChecker>
          <RulesChecker res='notifications' op='read'>
            <NotificationHub />
          </RulesChecker>
          {this.renderLogoutButton()}
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  }
}

Header.contextTypes = {
  reactor: PropTypes.object.isRequired
}

export default Header
