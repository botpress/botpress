import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { Navbar, Nav, NavItem, Glyphicon, NavDropdown, MenuItem } from 'react-bootstrap'
import classnames from 'classnames'

import NotificationHub from '~/components/Notifications/Hub'

import { logout } from '~/util/Auth'
import style from './Header.scss'
import { viewModeChanged } from '~/actions'
import PermissionsChecker from './PermissionsChecker'

class Header extends React.Component {
  state = {
    loading: true
  }

  handleFullscreen = () => {
    const newViewMode = this.props.viewMode < 1 ? 1 : 0
    this.props.viewModeChanged(newViewMode)
  }

  renderLogoutButton() {
    if (!window.AUTH_ENABLED) {
      return null
    }

    const url = this.props.user.avatar_url
    const label = url ? <img src={url} /> : <i className="material-icons">account_circle</i>

    return (
      <NavDropdown className={style.account} noCaret title={label} id="account-button">
        <MenuItem header>Signed in as</MenuItem>
        <MenuItem disabled>✉️&nbsp;{this.props.user.email}</MenuItem>
        <MenuItem disabled>👤&nbsp;{this.props.user.username}</MenuItem>
        <MenuItem divider />
        <MenuItem eventKey={1} onClick={logout}>
          <b>Logout</b>
        </MenuItem>
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
            <PermissionsChecker user={this.props.user} res="bot.logs" op="read">
              <NavItem href="/logs">
                <Glyphicon glyph="list-alt" />
              </NavItem>
            </PermissionsChecker>
            <PermissionsChecker user={this.props.user} res="bot.notifications" op="read">
              <NotificationHub />
            </PermissionsChecker>
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
