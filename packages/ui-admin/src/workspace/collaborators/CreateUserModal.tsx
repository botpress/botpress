import { Button, FormGroup } from '@blueprintjs/core'
import { WorkspaceUser } from 'botpress/sdk'
import { Dialog, lang } from 'botpress/shared'
import { AuthRole, AuthStrategyConfig, CreatedUser } from 'common/typings'
import React, { FC, useEffect, useState } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import AsyncSelect from 'react-select/lib/AsyncCreatable'
import api from '~/app/api'
import { AppState } from '~/app/rootReducer'

import AuthStrategyDropdown from './AuthStrategyDropdown'
import { fetchAvailableUsers } from './reducer'
import RoleDropdown from './RoleDropdown'

type Props = {
  isOpen?: boolean
  toggleOpen?: () => void
  onUserAdded?: () => void
  onUserCreated?: (newUser: CreatedUser) => void
  forcedRoleId?: string
} & ConnectedProps<typeof connector>

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

      const { data } = await api.getSecured().post('/admin/workspace/collaborators', {
        email: selectedUser.value,
        strategy: strategy.strategyId,
        role: role.id
      })

      props.onUserCreated && props.onUserCreated(data.payload)
    } else {
      const { email, strategy } = selectedUser.value
      await api.getSecured().post('/admin/workspace/collaborators/workspace/add', { email, strategy, role: role.id })
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
          id="btn-submit-create-user"
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

const mapStateToProps = (state: AppState) => ({
  availableUsers: state.collaborators.availableUsers
})

const connector = connect(mapStateToProps, { fetchAvailableUsers })

export default connector(CreateUserModal)
