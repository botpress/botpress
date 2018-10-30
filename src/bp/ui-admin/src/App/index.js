import _ from 'lodash'
import React, { Component, Fragment } from 'react'

import {
  Nav,
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

import logo from '../botpress.svg'

class Home extends Component {
  state = { isMenuOpen: true }

  componentDidMount() {
    if (!this.props.profile) {
      this.props.fetchProfile()
    }

    if (!this.props.teams) {
      this.props.fetchTeams()
    }
  }

  toggleMenu = () => {
    this.setState({ isMenuOpen: !this.state.isMenuOpen })
  }

  renderProfileMenu() {
    if (!this.props.profile) {
      return null
    }

    return (
      <UncontrolledDropdown nav inNavbar>
        <DropdownToggle nav caret>
          <span className="user-profile">
            <img alt="" src={this.props.profile.picture} className="user-avatar" />
            <span>{this.props.profile.username}</span>
          </span>
        </DropdownToggle>
        <DropdownMenu right>
          <DropdownItem onClick={() => this.props.history.push('/me')}>My profile</DropdownItem>
          <DropdownItem onClick={() => this.props.history.push('/license')}>License</DropdownItem>
          <DropdownItem disabled>Preferences</DropdownItem>
          <DropdownItem divider />
          <DropdownItem onClick={() => this.props.auth.logout()}>Logout</DropdownItem>
        </DropdownMenu>
      </UncontrolledDropdown>
    )
  }

  renderSwitchTeam() {
    if (!this.props.currentTeam) {
      return null
    }

    return (
      <UncontrolledDropdown nav inNavbar>
        <DropdownToggle nav caret>
          Teams
        </DropdownToggle>
        <DropdownMenu right>
          {this.props.teams &&
            _.take(this.props.teams, 5).map(team => {
              return (
                <DropdownItem key={team.id} onClick={() => this.props.history.push(`/teams/${team.id}`)}>
                  {team.name}
                </DropdownItem>
              )
            })}
          <DropdownItem divider />
          <DropdownItem onClick={() => this.props.history.push('/teams')}>See all</DropdownItem>
        </DropdownMenu>
      </UncontrolledDropdown>
    )
  }

  render() {
    return (
      <Fragment>
        <header className="bp-header">
          <div className="container">
            <Navbar expand="md">
              <NavbarBrand href="/admin">
                <img src={logo} alt="logo" className="bp-header__logo" />
                &nbsp;|&nbsp;
                <span className="bp-header__title">Admin</span>
              </NavbarBrand>
              <NavbarToggler onClick={this.toggleMenu} />
              <Collapse isOpen={this.state.isMenuOpen} navbar>
                <Nav className="ml-auto" navbar>
                  {this.renderSwitchTeam()}
                  {this.renderProfileMenu()}
                </Nav>
              </Collapse>
            </Navbar>
          </div>
        </header>
        <div className="main-content">{this.props.children}</div>
      </Fragment>
    )
  }
}

const mapStateToProps = state => ({
  teams: state.teams.items,
  currentTeamId: state.teams.teamId,
  currentTeam: state.teams.team,
  profile: state.user.profile
})

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      fetchProfile,
      fetchTeams
    },
    dispatch
  )

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Home)
