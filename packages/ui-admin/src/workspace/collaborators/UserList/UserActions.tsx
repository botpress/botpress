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
import { WorkspaceUserWithAttributes } from 'botpress/sdk'
import { confirmDialog, lang, toast } from 'botpress/shared'

import React, { FC } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import api from '~/app/api'
import { AppState } from '~/app/rootReducer'

type Props = {
  user: WorkspaceUserWithAttributes
  onUserUpdated: () => void
  onPasswordReset: (email, newPassword) => void
} & ConnectedProps<typeof connector>

const UserActions: FC<Props> = props => {
  const { user } = props

  const resetPassword = async () => {
    if (
      !(await confirmDialog(
        lang.tr('admin.workspace.users.collaborators.passwordResetConfirm', {
          user: user.email
        }),
        {
          acceptLabel: lang.tr('reset')
        }
      ))
    ) {
      return
    }

    try {
      const { data } = await api.getSecured().get(`/admin/workspace/collaborators/reset/${user.strategy}/${user.email}`)
      toast.success(lang.tr('admin.workspace.users.collaborators.passwordResetSuccess'))
      props.onPasswordReset(user.email, data.payload.tempPassword)
    } catch (err) {
      toast.failure(lang.tr('admin.workspace.users.collaborators.passwordResetFail', { msg: err.message }))
    }
  }

  const deleteUser = async () => {
    if (
      !(await confirmDialog(
        lang.tr('admin.workspace.users.collaborators.deleteAccountConfirm', {
          user: user.email
        }),
        {
          acceptLabel: lang.tr('delete')
        }
      ))
    ) {
      return
    }

    try {
      await api.getSecured().post(`/admin/workspace/collaborators/${user.strategy}/${user.email}/delete`)
      toast.success(
        lang.tr('admin.workspace.users.collaborators.deleteAccountSuccess', {
          user: user.email
        })
      )
      props.onUserUpdated()
    } catch (err) {
      toast.failure(lang.tr('admin.workspace.users.collaborators.deleteAccountFail', { msg: err.message }))
    }
  }

  const removeUser = async () => {
    if (
      !(await confirmDialog(
        lang.tr('admin.workspace.users.collaborators.removeConfirm', {
          user: user.email
        }),
        {
          acceptLabel: lang.tr('remove')
        }
      ))
    ) {
      return
    }

    try {
      await api
        .getSecured()
        .post(`/admin/workspace/collaborators/workspace/remove/${user.strategy}/${user.email}/delete`)
      toast.success(
        lang.tr('admin.workspace.users.collaborators.removeSuccess', {
          user: user.email
        })
      )
      props.onUserUpdated()
    } catch (err) {
      toast.failure(lang.tr('admin.workspace.users.collaborators.removeFail', { msg: err.message }))
    }
  }

  const changeRole = async (newRoleId: string) => {
    try {
      await api.getSecured().post('/admin/workspace/collaborators/workspace/update_role', {
        ...props.user,
        role: newRoleId
      })

      toast.success(lang.tr('admin.workspace.users.collaborators.roleUpdateSuccess'))
      props.onUserUpdated()
    } catch (err) {
      toast.failure(lang.tr('admin.workspace.users.collaborators.roleUpdateFail', { msg: err.message }))
    }
  }

  if (!props.authConfig || !props.user) {
    return null
  }

  const strategy = props.authConfig.find(x => x.strategyId === user.strategy)
  const canChangePassword = strategy && strategy.strategyType === 'basic'

  return (
    <Popover minimal position={Position.BOTTOM} interactionKind={PopoverInteractionKind.HOVER}>
      <Button
        id="btn-menu-collaborators"
        rightIcon="caret-down"
        text={lang.tr('admin.workspace.users.collaborators.action')}
      />
      <Menu>
        {canChangePassword && (
          <MenuItem
            text={lang.tr('admin.workspace.users.collaborators.resetPassword')}
            onClick={resetPassword}
            icon="key"
            key="reset"
            id="btn-resetPassword"
          />
        )}

        <MenuItem id="btn-changeRole" text={lang.tr('admin.workspace.users.collaborators.changeRole')} icon="people">
          {props.roles.map(role => (
            <MenuItem
              text={lang.tr(role.name)}
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

        <MenuItem
          text={lang.tr('admin.workspace.users.collaborators.removeFromWorkspace')}
          onClick={removeUser}
          icon="remove"
          key="remove"
          id="btn-removeUser"
        />
        <MenuItem
          text={lang.tr('delete')}
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

const mapStateToProps = (state: AppState) => ({
  roles: state.roles.roles,
  authConfig: state.auth.authConfig
})

const connector = connect(mapStateToProps)
export default connector(UserActions)
