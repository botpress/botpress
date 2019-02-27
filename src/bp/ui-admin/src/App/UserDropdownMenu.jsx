import React, { Component } from 'react'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'

import { fetchProfile } from '../reducers/user'
import Auth from '../Auth/index'
import GravatarImage from '../Pages/Components/GravatarImage'

import { UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap'

class UserDropdownMenu extends Component {
  constructor(props) {
    super(props)

    this.auth = new Auth()
  }

  componentDidMount() {
    !this.props.profile && this.props.fetchProfile()
  }

  gotoServer = () => {
    if (this.props.licensing && this.props.licensing.isPro) {
      this.props.push('/server/monitoring')
    } else {
      this.props.push('/server/license')
    }
  }

  renderDropdown = () => {
    const { email, fullName, isSuperAdmin } = this.props.profile

    return (
      <UncontrolledDropdown nav inNavbar>
        <DropdownToggle nav caret>
          <span className="user-profile">
            <GravatarImage email={this.props.profile.email} size="sm" className="user-avatar" />
          </span>
        </DropdownToggle>
        <DropdownMenu right>
          <DropdownItem onClick={() => this.props.push('/profile/me')}>
            Signed in as&nbsp;
            <strong>{fullName || email}</strong>
          </DropdownItem>
          <DropdownItem divider />
          <DropdownItem onClick={() => this.props.push('/profile/me')}>My account</DropdownItem>
          {isSuperAdmin && <DropdownItem onClick={this.gotoServer}>Server</DropdownItem>}
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
  profile: state.user.profile,
  licensing: state.license.licensing
})

const mapDispatchToProps = {
  fetchProfile,
  push
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(UserDropdownMenu)
