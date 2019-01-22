import React, { Component } from 'react'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'

import { fetchProfile } from '../reducers/user'
import Auth from '../Auth/index'

import { UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap'

class UserDropdownMenu extends Component {
  constructor(props) {
    super(props)

    this.auth = new Auth()
  }

  componentDidMount() {
    !this.props.profile && this.props.fetchProfile()
  }

  renderDropdown = () => {
    const { email, fullName, isSuperAdmin } = this.props.profile

    return (
      <UncontrolledDropdown nav inNavbar>
        <DropdownToggle nav caret>
          <span className="user-profile">
            <img alt="" src={this.props.profile.picture} className="user-avatar" />
          </span>
        </DropdownToggle>
        <DropdownMenu right>
          <DropdownItem onClick={() => this.props.push('/profile')}>
            Signed in as&nbsp;
            <strong>{fullName || email}</strong>`
          </DropdownItem>
          <DropdownItem divider />
          <DropdownItem onClick={() => this.props.push('/profile')}>Your profile</DropdownItem>
          {isSuperAdmin && <DropdownItem onClick={() => this.props.push('/settings')}>Cluster settings</DropdownItem>}
          <DropdownItem onClick={() => this.auth.logout()}>Logout</DropdownItem>
        </DropdownMenu>
      </UncontrolledDropdown>
    )
  }

  render() {
    return this.props.profile ? this.renderDropdown() : null
  }
}

const mapStateToProps = state => ({
  profile: state.user.profile
})

const mapDispatchToProps = {
  fetchProfile,
  push
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(UserDropdownMenu)
