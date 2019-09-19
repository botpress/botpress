import {
  Button,
  Colors,
  Icon,
  Menu,
  MenuDivider,
  MenuItem,
  Popover,
  PopoverInteractionKind,
  Position
} from '@blueprintjs/core'
import React, { FC, useEffect } from 'react'
import { connect } from 'react-redux'
import history from '~/history'

import { fetchProfile } from '../reducers/user'
import Auth from '../Auth/index'
import BasicAuthentication from '../Auth/index'

interface Props {
  fetchProfile: () => void
  profile: any
}

const UserDropdownMenu: FC<Props> = props => {
  useEffect(() => {
    !props.profile && props.fetchProfile()
  }, [])

  const logout = () => {
    const auth: BasicAuthentication = new Auth()
    auth.logout()
  }

  if (!props.profile) {
    return null
  }

  const { email, fullName } = props.profile

  return (
    <Popover minimal position={Position.BOTTOM} interactionKind={PopoverInteractionKind.HOVER}>
      <Button
        id="btn-menu"
        icon={<Icon icon="user" color={Colors.WHITE} />}
        rightIcon={<Icon icon="caret-down" color={Colors.WHITE} />}
        minimal={true}
      />
      <Menu>
        <MenuDivider title={`Signed in as ${fullName || email}`} />
        <MenuItem id="btn-profile" icon="user" text="My account" onClick={() => history.push('/profile/me')} />
        <MenuDivider />
        <MenuItem id="btn-logout" icon="log-out" text="Logout" onClick={logout} />
      </Menu>
    </Popover>
  )
}

const mapStateToProps = (state: any) => ({ profile: state.user.profile })

export default connect(
  mapStateToProps,
  { fetchProfile }
)(UserDropdownMenu)
