import _ from 'lodash'
import React, { Component } from 'react'

import {
  Nav,
  Navbar,
  NavbarBrand,
  NavbarToggler,
  Collapse,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  NavItem,
  NavLink
} from 'reactstrap'

import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { fetchTeams } from '../modules/teams'
import { fetchProfile } from '../modules/user'

class Home extends Component {
  state = { isOpen: true }

  componentDidMount() {
    if (!this.props.profile) {
      this.props.fetchProfile()
    }

    if (!this.props.teams) {
      this.props.fetchTeams()
    }
  }

  login() {
    this.props.auth.login()
  }

  toggle = () => {
    this.setState({ isOpen: !this.state.isOpen })
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
            <span>{this.props.profile.fullName}</span>
          </span>
        </DropdownToggle>
        <DropdownMenu right>
          <DropdownItem onClick={() => this.props.history.push('/me')}>My profile</DropdownItem>
          <DropdownItem disabled>Preferences</DropdownItem>
          <DropdownItem divider />
          <DropdownItem onClick={() => this.props.auth.logout()}>Logout</DropdownItem>
        </DropdownMenu>
      </UncontrolledDropdown>
    )
  }

  renderSwitchTeam() {
    if (!this.props.currentTeam) {
      return (
        <NavItem>
          <NavLink href="/teams">Choose team</NavLink>
        </NavItem>
      )
    }

    return (
      <UncontrolledDropdown nav inNavbar>
        <DropdownToggle nav caret>
          {this.props.currentTeam.name}
        </DropdownToggle>
        <DropdownMenu right>
          {this.props.teams &&
            _.take(this.props.teams, 5).map(team => {
              return (
                <DropdownItem key={team.id} onClick={() => this.props.history.push('/teams/' + team.id)}>
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
      <div>
        <Navbar dark color="dark" expand="md">
          <div className="container">
            <NavbarBrand href="/">
              Botpress <span className="txt-light">Cloud</span>
            </NavbarBrand>
            <NavbarToggler onClick={this.toggle} />
            <Collapse isOpen={this.state.isOpen} navbar>
              <Nav className="ml-auto" navbar>
                {this.renderSwitchTeam()}
                {this.renderProfileMenu()}
              </Nav>
            </Collapse>
          </div>
        </Navbar>
        <div className="main-content container">{this.props.children}</div>
      </div>
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
