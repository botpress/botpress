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
import cx from 'classnames'
import React, { FC, useEffect, useState } from 'react'
import { connect, ConnectedProps } from 'react-redux'

import { AppState } from '~/app/rootReducer'
import BasicAuthentication from '~/auth/basicAuth'
import ChangeLanguage from '~/user/ChangeLanguage'
import { fetchProfile } from './reducer'
import style from './style.scss'
import UpdatePassword from './UpdatePassword'
import UserProfile from './UpdateUserProfile'

type Props = ConnectedProps<typeof connector>

const UserDropdownMenu: FC<Props> = props => {
  const [isProfileOpen, setProfileOpen] = useState(false)
  const [isPasswordOpen, setPasswordOpen] = useState(false)
  const [isLanguageOpen, setLanguageOpen] = useState(false)

  useEffect(() => {
    !props.profile && props.fetchProfile()
  }, [])

  const logout = async () => {
    const auth: BasicAuthentication = new BasicAuthentication()
    await auth.logout()
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
    <img src={picture_url} className={cx('dropdown-picture', style.dropdown_picture)} />
  ) : (
    <Icon icon="user" color={Colors.BLACK} />
  )

  return (
    <div>
      <Popover minimal position={Position.BOTTOM} interactionKind={PopoverInteractionKind.CLICK}>
        <Button id="btn-menu-user-dropdown" icon={icon} minimal rightIcon={<Icon icon="caret-down" />} />
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

const mapStateToProps = (state: AppState) => ({ profile: state.user.profile })
const connector = connect(mapStateToProps, { fetchProfile })

export default connector(UserDropdownMenu)
