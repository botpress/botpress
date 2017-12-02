import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { Navbar, Nav, NavItem, Glyphicon, NavDropdown } from 'react-bootstrap'
import classnames from 'classnames'

import NotificationHub from '~/components/Notifications/Hub'
import ProfileMenu from '+/views/ProfileMenu'
import RulesChecker from '+/views/RulesChecker'

import { logout } from '~/util/Auth'
import style from './Header.scss'
import { viewModeChanged } from '~/actions'

class Header extends React.Component {
  state = {
    loading: true
  }

  getProfileImgUrl() {
    if (!this.props.user.avatarURL) {
      return null
    }
    return '/api/enterprise/accounts/avatars/' + this.props.user.avatarURL
  }

  handleFullscreen = () => {
    const newViewMode = this.props.viewMode < 1 ? 1 : 0
    this.props.viewModeChanged(newViewMode)
  }

  renderLogoutButton() {
    if (!window.AUTH_ENABLED) {
      return null
    }

    const url = this.getProfileImgUrl()
    const label = url ? <img src={url} /> : <i className="material-icons">account_circle</i>

    return (
      <NavDropdown className={style.account} noCaret title={label} id="account-button">
        <ProfileMenu logout={logout} />
      </NavDropdown>
    )
  }

  renderFullScreenButton() {
    return (
      <span className={classnames(style.fullScreen, 'bp-full-screen')}>
        <Glyphicon glyph="fullscreen" />
      </span>
    )
  }

  render() {
    if (this.props.viewMode >= 3) {
      return null
    }

    const classNames = classnames(style.navbar, style['app-navbar'], 'bp-navbar')
    const customStyle = this.props.customStyle['bp-navbar']

    return (
      <Navbar className={classNames} style={customStyle}>
        <Navbar.Collapse>
          <Nav pullRight>
            <NavItem onClick={this.handleFullscreen}>{this.renderFullScreenButton()}</NavItem>
            <RulesChecker res="bot/logs" op="read">
              <NavItem href="/logs">
                <Glyphicon glyph="list-alt" />
              </NavItem>
            </RulesChecker>
            <RulesChecker res="notifications" op="read">
              <NotificationHub />
            </RulesChecker>
            {this.renderLogoutButton()}
          </Nav>
          <Nav pullRight className="bp-navbar-module-buttons" />
        </Navbar.Collapse>
      </Navbar>
    )
  }
}

const mapStateToProps = state => ({
  user: state.user,
  viewMode: state.ui.viewMode,
  customStyle: state.ui.customStyle
})

const mapDispatchToProps = dispatch => bindActionCreators({ viewModeChanged }, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(Header)
