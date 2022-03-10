import { Button } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import React, { FC, useEffect, useState } from 'react'
import { connect, ConnectedProps } from 'react-redux'

import PageContainer from '~/app/common/PageContainer'
import SplitPage from '~/app/common/SplitPage'
import { AppState } from '~/app/rootReducer'
import { fetchAuthConfig } from '~/auth/reducer'
import { fetchRoles } from '~/workspace/roles/reducer'
import CreateUserModal from './CreateUserModal'
import { fetchUsers } from './reducer'
import ShowInfoModal from './ShowInfoModal'
import UserList from './UserList'

type Props = ConnectedProps<typeof connector>

const List: FC<Props> = props => {
  useEffect(() => {
    !props.roles.length && props.fetchRoles()
    !props.authConfig && props.fetchAuthConfig()
  }, [])

  useEffect(() => {
    if (props.roles) {
      reloadUsers()
    }
  }, [props.roles])

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [messageId, setMessageId] = useState<any>()

  const reloadUsers = () => {
    const filteredRoles = props.roles.map(x => x.id).join(',')
    props.fetchUsers(filteredRoles)
  }

  const onUserCreated = createdUser => {
    setMessageId('newAccount')
    setCreateModalOpen(false)
    setInfoModalOpen(true)
    setEmail(createdUser.email)
    setPassword(createdUser.tempPassword)
    reloadUsers()
  }

  const onUserAdded = () => {
    setCreateModalOpen(false)
    reloadUsers()
  }

  const onPasswordReset = (email, password) => {
    setMessageId('passwordReset')
    setEmail(email)
    setPassword(password)
    setInfoModalOpen(true)
  }

  return (
    <PageContainer
      title={lang.tr('admin.workspace.users.collaborators.collaborators')}
      helpText={lang.tr('admin.workspace.users.collaborators.help')}
    >
      <SplitPage
        sideMenu={
          <div>
            <Button
              id="btn-create-collaborator"
              style={{ width: 160 }}
              text={lang.tr('admin.workspace.users.collaborators.add')}
              icon="add"
              onClick={() => setCreateModalOpen(true)}
            />

            <CreateUserModal
              isOpen={createModalOpen}
              toggleOpen={() => setCreateModalOpen(!createModalOpen)}
              onUserCreated={onUserCreated}
              onUserAdded={onUserAdded}
            />

            <ShowInfoModal
              isOpen={infoModalOpen}
              toggle={() => setInfoModalOpen(!infoModalOpen)}
              messageId={messageId}
              email={email}
              password={password}
            />
          </div>
        }
      >
        <UserList onPasswordReset={onPasswordReset} onUserUpdated={reloadUsers} />
      </SplitPage>
    </PageContainer>
  )
}

const mapStateToProps = (state: AppState) => ({
  loading: state.collaborators.loading,
  roles: state.roles.roles,
  authConfig: state.auth.authConfig
})

const connector = connect(mapStateToProps, { fetchUsers, fetchRoles, fetchAuthConfig })
export default connector(List)
