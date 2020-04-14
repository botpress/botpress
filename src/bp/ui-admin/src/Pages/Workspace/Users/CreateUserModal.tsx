import { Button, FormGroup } from '@blueprintjs/core'
import { Dialog, lang } from 'botpress/shared'
import { AuthRole, AuthStrategyConfig, CreatedUser, WorkspaceUser, WorkspaceUserInfo } from 'common/typings'
import React, { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import AsyncSelect from 'react-select/lib/AsyncCreatable'
import RoleDropdown from '~/Pages/Workspace/Users/RoleDropdown'

import api from '../../../api'
import { fetchAvailableUsers } from '../../../reducers/user'

import AuthStrategyDropdown from './AuthStrategyDropdown'

interface OwnProps {
  isOpen?: boolean
  toggleOpen?: () => void
  onUserAdded?: () => void
  onUserCreated?: (newUser: CreatedUser) => void
  forcedRoleId?: string
}

interface DispatchProps {
  fetchAvailableUsers: (roleId?: string) => void
}

interface StateProps {
  availableUsers: WorkspaceUserInfo[]
}

type Props = DispatchProps & StateProps & OwnProps

interface UserOption {
  label: string
  value: WorkspaceUser
  __isNew__?: boolean
}

export const CreateUserModal: FC<Props> = props => {
  const [role, setRole] = useState<AuthRole>()
  const [strategy, setStrategy] = useState<AuthStrategyConfig>()
  const [selectedUser, setSelectedUser] = useState<UserOption>()

  useEffect(() => {
    props.fetchAvailableUsers()
    setSelectedUser(undefined)
  }, [props.isOpen])

  const isCreating = selectedUser && selectedUser.__isNew__
  const isValid = selectedUser && role && (!isCreating || (isCreating && strategy))

  const createUser = async () => {
    if (!selectedUser || !role) {
      return
    }

    if (isCreating) {
      if (!strategy) {
        return
      }

      const { data } = await api.getSecured().post('/admin/users', {
        email: selectedUser.value,
        strategy: strategy.strategyId,
        role: role.id
      })

      props.onUserCreated && props.onUserCreated(data.payload)
    } else {
      const { email, strategy } = selectedUser.value
      await api.getSecured().post('/admin/users/workspace/add', { email, strategy, role: role.id })
      props.onUserAdded && props.onUserAdded()
    }
  }

  const loadOptions = async (inputValue: string) => {
    if (!inputValue.length || !props.availableUsers) {
      return
    }

    const searchString = inputValue.toLowerCase()
    return props.availableUsers
      .filter(x => x.email.toLowerCase().includes(searchString))
      .map((user: any) => {
        return { label: `${user.email} (${user.strategy})`, value: user }
      })
  }

  return (
    <Dialog.Wrapper
      title={lang.tr('admin.workspace.users.collaborators.add')}
      icon="add"
      isOpen={props.isOpen}
      onClose={props.toggleOpen}
      onSubmit={createUser}
    >
      <Dialog.Body>
        <FormGroup
          label={lang.tr('email')}
          labelFor="select-email"
          helperText={lang.tr('admin.workspace.users.collaborators.inviteExistingUser')}
        >
          <AsyncSelect
            id="select-email"
            cacheOptions
            defaultOptions
            value={selectedUser}
            loadOptions={loadOptions}
            onChange={option => setSelectedUser(option as any)}
            autoFocus={true}
          />
        </FormGroup>

        {isCreating && (
          <FormGroup label={lang.tr('admin.workspace.users.collaborators.authStrategy')} labelFor="select-strategy">
            <AuthStrategyDropdown onChange={strategy => setStrategy(strategy)} />
          </FormGroup>
        )}

        <FormGroup label={lang.tr('admin.workspace.users.collaborators.chooseRole')} labelFor="select-role">
          <RoleDropdown onChange={role => setRole(role)} />
        </FormGroup>
      </Dialog.Body>
      <Dialog.Footer>
        <Button
          id="btn-submit"
          className="float-right"
          type="submit"
          text={
            isCreating
              ? lang.tr('admin.workspace.users.collaborators.createAccount')
              : lang.tr('admin.workspace.users.collaborators.addToWorkspace')
          }
          disabled={!isValid}
        />
      </Dialog.Footer>
    </Dialog.Wrapper>
  )
}

const mapStateToProps = state => ({
  availableUsers: state.user.availableUsers
})

const mapDispatchToProps = {
  fetchAvailableUsers
}

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, mapDispatchToProps)(CreateUserModal)
