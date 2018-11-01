import React, { Component, Fragment } from 'react'

import {
  Nav,
  NavLink,
  Navbar,
  NavbarBrand,
  NavbarToggler,
  Collapse,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem
} from 'reactstrap'

import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { fetchTeams } from '../modules/teams'
import { fetchProfile } from '../modules/user'
import { fetchLicensing } from '../modules/license'

import logo from '../botpress.svg'

class Home extends Component {
  state = { isMenuOpen: true }
  toggleMenu = () => {
    this.setState({ isMenuOpen: !this.state.isMenuOpen })
  }

  componentDidMount() {
    !this.props.teams && this.props.fetchTeams()
    !this.props.profile && this.props.fetchProfile()
    !this.props.licensing && this.props.fetchLicensing()
  }

  renderProfileMenu() {
    if (!this.props.profile) {
      return null
    }

    const { username, fullName } = this.props.profile

    const licenseEnabled = this.props.licensing && this.props.licensing.edition !== 'ce'

    return (
      <UncontrolledDropdown nav inNavbar>
        <DropdownToggle nav caret>
          <span className="user-profile">
            <img alt="" src={this.props.profile.picture} className="user-avatar" />
            <span>{fullName ? fullName : username}</span>
          </span>
        </DropdownToggle>
        <DropdownMenu right>
          <DropdownItem onClick={() => this.props.history.push('/profile')}>My profile</DropdownItem>
          {licenseEnabled && <DropdownItem onClick={() => this.props.history.push('/license')}>License</DropdownItem>}
          <DropdownItem divider />
          <DropdownItem onClick={() => this.props.auth.logout()}>Logout</DropdownItem>
        </DropdownMenu>
      </UncontrolledDropdown>
    )
  }

  render() {
    return (
      <Fragment>
        <header className="bp-header">
          <Navbar expand="md">
            <NavbarBrand href="/admin">
              <img src={logo} alt="logo" className="bp-header__logo" />
              &nbsp;|&nbsp;
              <span className="bp-header__title">Admin</span>
            </NavbarBrand>
            <NavbarToggler onClick={this.toggleMenu} />
            <Collapse isOpen={this.state.isMenuOpen} navbar>
              <Nav className="ml-auto" navbar>
                {this.renderProfileMenu()}
              </Nav>
            </Collapse>
          </Navbar>
        </header>
        {this.renderUnlicensed()}
        <div className="bp-main-content">{this.props.children}</div>
      </Fragment>
    )
  }

  renderUnlicensed() {
    const isLicensed =
      !this.props.licensing || this.props.licensing.edition === 'ce' || this.props.licensing.status === 'licensed'

    if (isLicensed) {
      return null
    }

    return (
      <div className="bp-header__warning">
        <NavLink href="/admin/license">
          <svg viewBox="0 0 90 82" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M88.21 65.042L54.084 5.932A10.53 10.53 0 0 0 44.99.682a10.53 10.53 0 0 0-9.094 5.25L1.467 65.568a10.532 10.532 0 0 0 0 10.5 10.53 10.53 0 0 0 9.094 5.25H79.44c5.79 0 10.5-4.71 10.5-10.5a10.458 10.458 0 0 0-1.73-5.776zm-8.771 9.275H10.561a3.51 3.51 0 0 1-3.031-1.75 3.51 3.51 0 0 1 0-3.5L41.96 9.433a3.509 3.509 0 0 1 3.031-1.75 3.51 3.51 0 0 1 3.031 1.75l34.184 59.208c.042.073.087.145.135.215.393.578.6 1.257.6 1.962a3.507 3.507 0 0 1-3.502 3.499zM45 54.93a3.912 3.912 0 0 0 3.912-3.912V30.687a3.912 3.912 0 0 0-7.824 0v20.331A3.912 3.912 0 0 0 45 54.93zm0 2.295c-1.32 0-2.601.53-3.54 1.46-.93.93-1.46 2.22-1.46 3.54 0 1.31.53 2.6 1.46 3.53a5.078 5.078 0 0 0 3.54 1.47c1.31 0 2.6-.54 3.53-1.47a5.002 5.002 0 0 0 1.47-3.53 5.003 5.003 0 0 0-5-5z"
              fill="#FFF"
              fillRule="nonzero"
            />
          </svg>
          Botpress is currently not licensed. Please update your license to re-enable all features.
        </NavLink>
      </div>
    )
  }
}

const mapStateToProps = state => ({
  teams: state.teams.items,
  currentTeamId: state.teams.teamId,
  currentTeam: state.teams.team,
  profile: state.user.profile,
  licensing: state.license.licensing
})

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      fetchProfile,
      fetchTeams,
      fetchLicensing
    },
    dispatch
  )

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Home)
