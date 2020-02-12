import {
  Button,
  Intent,
  Menu,
  MenuDivider,
  MenuItem,
  Popover,
  PopoverInteractionKind,
  Position
} from '@blueprintjs/core'
import { AuthRole, AuthStrategyConfig, WorkspaceUser } from 'common/typings'
import React, { FC } from 'react'
import { connect } from 'react-redux'
import api from '~/api'
import { toastFailure, toastSuccess } from '~/utils/toaster'
import confirmDialog from '~/App/ConfirmDialog'

interface OwnProps {
  user: WorkspaceUser
  onUserUpdated: () => void
  onPasswordReset: (email, newPassword) => void
}

interface StateProps {
  roles: AuthRole[]
  authConfig: AuthStrategyConfig[]
}

type Props = StateProps & OwnProps

const UserActions: FC<Props> = props => {
  const { user } = props

  const resetPassword = async () => {
    if (
      !(await confirmDialog(`Are you sure you want to reset ${user.email}'s password?`, {
        acceptLabel: 'Reset'
      }))
    ) {
      return
    }

    try {
      const { data } = await api.getSecured().get(`/admin/users/reset/${user.strategy}/${user.email}`)
      toastSuccess(`Password reset successful`)
      props.onPasswordReset(user.email, data.payload.tempPassword)
    } catch (err) {
      toastFailure(`Could not reset password: ${err.message}`)
    }
  }

  const deleteUser = async () => {
    if (
      !(await confirmDialog(`Are you sure you want to delete ${user.email}'s account?`, {
        acceptLabel: 'Delete'
      }))
    ) {
      return
    }

    try {
      await api.getSecured().post(`/admin/users/${user.strategy}/${user.email}/delete`)
      toastSuccess(`User ${user.email} was deleted successfully`)
      props.onUserUpdated()
    } catch (err) {
      toastFailure(`Could not delete user: ${err.message}`)
    }
  }

  const removeUser = async () => {
    if (
      !(await confirmDialog(`Are you sure you want to remove ${user.email} from this workspace?`, {
        acceptLabel: 'Remove'
      }))
    ) {
      return
    }

    try {
      await api.getSecured().post(`/admin/users/workspace/remove/${user.strategy}/${user.email}/delete`)
      toastSuccess(`User ${user.email} was removed from workspace successfully`)
      props.onUserUpdated()
    } catch (err) {
      toastFailure(`Could not remove user from workspace: ${err.message}`)
    }
  }

  const changeRole = async (newRoleId: string) => {
    try {
      await api.getSecured().post(`/admin/users/workspace/update_role`, {
        ...props.user,
        role: newRoleId
      })

      toastSuccess(`Role updated successfully`)
      props.onUserUpdated()
    } catch (err) {
      toastFailure(`Could not update role: ${err.message}`)
    }
  }

  if (!props.authConfig || !props.user) {
    return null
  }

  const strategy = props.authConfig.find(x => x.strategyId === user.strategy)
  const canChangePassword = strategy && strategy.strategyType === 'basic'

  return (
    <Popover minimal position={Position.BOTTOM} interactionKind={PopoverInteractionKind.HOVER}>
      <Button id="btn-menu" rightIcon="caret-down" text="Action" />
      <Menu>
        {canChangePassword && (
          <MenuItem text="Reset Password" onClick={resetPassword} icon="key" key="reset" id="btn-resetPassword" />
        )}

        <MenuItem id="btn-changeRole" text="Change Role" icon="people">
          {props.roles.map(role => (
            <MenuItem
              text={role.name}
              key={role.id}
              id={`btn-role-${role.id}`}
              disabled={user.role === role.id}
              icon={user.role === role.id ? 'arrow-right' : 'dot'}
              onClick={() => changeRole(role.id)}
              tagName="button"
            />
          ))}
          {/* <MenuDivider />
          <MenuItem
            text="Chat User"
            disabled={user.role === CHAT_USER_ROLE.id}
            icon={user.role === CHAT_USER_ROLE.id ? 'arrow-right' : 'dot'}
            onClick={() => changeRole(CHAT_USER_ROLE.id)}
            tagName="button"
          /> */}
        </MenuItem>

        <MenuDivider />

        <MenuItem text="Remove from workspace" onClick={removeUser} icon="remove" key="remove" id="btn-removeUser" />
        <MenuItem
          text="Delete"
          onClick={deleteUser}
          icon="trash"
          key="delete"
          id="btn-deleteUser"
          intent={Intent.DANGER}
        />
      </Menu>
    </Popover>
  )
}

const mapStateToProps = state => ({
  roles: state.roles.roles,
  authConfig: state.user.authConfig
})

export default connect<StateProps>(mapStateToProps, {})(UserActions)
