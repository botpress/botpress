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
import { fetchBotInformation, fetchAllBots } from '../../actions'

class Header extends React.Component {
  state = {
    loading: true
  }

  componentDidMount() {
    this.props.fetchAllBots()
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
            <PermissionsChecker user={this.props.user} res="bot.logs" op="read">
              <NavItem href={window.BP_BASE_PATH + '/logs'}>
                <Glyphicon glyph="list-alt" />
              </NavItem>
            </PermissionsChecker>
            <PermissionsChecker user={this.props.user} res="bot.notifications" op="read">
              <NotificationHub />
            </PermissionsChecker>
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
  customStyle: state.ui.customStyle,
  bot: state.bot,
  bots: state.bots
})

const mapDispatchToProps = dispatch =>
  bindActionCreators({ viewModeChanged, fetchBotInformation, fetchAllBots }, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Header)
