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
import { lang } from 'botpress/shared'
import React, { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import ChangeLanguage from '~/Pages/MyAccount/ChangeLanguage'
import UpdatePassword from '~/Pages/MyAccount/UpdatePassword'
import UserProfile from '~/Pages/MyAccount/UpdateUserProfile'

import { fetchProfile } from '../reducers/user'
import Auth from '../Auth/index'
import BasicAuthentication from '../Auth/index'

interface Props {
  fetchProfile: () => void
  profile: any
}

const UserDropdownMenu: FC<Props> = props => {
  const [isProfileOpen, setProfileOpen] = useState(false)
  const [isPasswordOpen, setPasswordOpen] = useState(false)
  const [isLanguageOpen, setLanguageOpen] = useState(false)

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

  const toggleProfile = () => setProfileOpen(!isProfileOpen)
  const togglePassword = () => setPasswordOpen(!isPasswordOpen)
  const toggleLanguage = () => setLanguageOpen(!isLanguageOpen)

  const { email, fullName, strategyType, picture_url } = props.profile
  const canChangePassword = strategyType === 'basic'

  const icon = picture_url ? (
    <img src={picture_url} className="dropdown-picture" />
  ) : (
    <Icon icon="user" color={Colors.WHITE} />
  )

  return (
    <div>
      <Popover minimal position={Position.BOTTOM} interactionKind={PopoverInteractionKind.CLICK}>
        <Button id="btn-menu" icon={icon} rightIcon={<Icon icon="caret-down" color={Colors.WHITE} />} minimal={true} />
        <Menu>
          <MenuDivider title={lang.tr('admin.signedInAs', { name: fullName || email })} />
          <MenuItem id="btn-profile" icon="user" text={lang.tr('admin.updateProfile')} onClick={toggleProfile} />

          {canChangePassword && (
            <MenuItem id="btn-changepass" icon="key" text={lang.tr('admin.changePassword')} onClick={togglePassword} />
          )}

          <MenuItem
            id="btn-changeLanguage"
            icon="translate"
            text={lang.tr('admin.changeLanguage')}
            onClick={toggleLanguage}
          />

          <MenuDivider />
          <MenuItem id="btn-logout" icon="log-out" text={lang.tr('admin.logout')} onClick={logout} />
        </Menu>
      </Popover>

      <UpdatePassword profile={props.profile} isOpen={isPasswordOpen} toggle={togglePassword} />

      <UserProfile
        isOpen={isProfileOpen}
        toggle={toggleProfile}
        profile={props.profile}
        fetchProfile={props.fetchProfile}
      />

      <ChangeLanguage isOpen={isLanguageOpen} toggle={toggleLanguage} />
    </div>
  )
}

const mapStateToProps = (state: any) => ({ profile: state.user.profile })

export default connect(mapStateToProps, { fetchProfile })(UserDropdownMenu)
