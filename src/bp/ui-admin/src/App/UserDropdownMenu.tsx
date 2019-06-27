import { Button, Menu, MenuDivider, MenuItem, Popover, PopoverInteractionKind, Position } from '@blueprintjs/core'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'

import { fetchProfile } from '../reducers/user'
import Auth from '../Auth/index'
import BasicAuthentication from '../Auth/index'
import GravatarImage from '../Pages/Components/GravatarImage'

class UserDropdownMenu extends Component<Props> {
  private auth: BasicAuthentication

  constructor(props: Props) {
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

  renderPopover() {
    const { email, fullName, isSuperAdmin } = this.props.profile
    return (
      <Popover minimal position={Position.BOTTOM} interactionKind={PopoverInteractionKind.HOVER}>
        <Button
          icon={<GravatarImage email={this.props.profile.email} size="sm" className="user-avatar" />}
          rightIcon="caret-down"
          minimal={true}
        />
        <Menu>
          <MenuDivider title={`Signed in as ${fullName || email}`} />

          {isSuperAdmin && (
            <React.Fragment>
              <MenuDivider />
              <MenuItem icon="dashboard" text="Manage Server" onClick={this.gotoServer} />
              <MenuItem icon="console" text="Configure Debug" onClick={() => this.props.push('/server/debug')} />
              <MenuItem icon="globe-network" text="Languages" onClick={() => this.props.push('/server/languages')} />
            </React.Fragment>
          )}

          <MenuDivider />
          <MenuItem icon="user" text="My account" onClick={() => this.props.push('/profile/me')} />
          <MenuItem icon="log-out" text="Logout" onClick={() => this.auth.logout()} />
        </Menu>
      </Popover>
    )
  }

  render() {
    return this.props.profile ? this.renderPopover() : null
  }
}

const mapStateToProps = (state: any) => ({
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

interface Props {
  fetchProfile: any
  licensing: any
  push: any
  profile: any
}
