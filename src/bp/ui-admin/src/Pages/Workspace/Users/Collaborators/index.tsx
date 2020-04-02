import { Button } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import { AuthRole, AuthStrategyConfig } from 'common/typings'
import React, { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { AppState } from '~/reducers'
import PageContainer from '~/App/PageContainer'
import SplitPage from '~/App/SplitPage'

import { fetchRoles } from '../../../../reducers/roles'
import { fetchAuthConfig, fetchUsers } from '../../../../reducers/user'
import CreateUserModal from '../CreateUserModal'
import ShowInfoModal from '../ShowInfoModal'
import UserList from '../UserList'

interface Props {
  fetchRoles: () => void
  fetchUsers: (filterRole?: string) => void
  fetchAuthConfig: () => void
  roles: AuthRole[]
  authConfig?: AuthStrategyConfig[]
}

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
  const [email, setEmail] = useState()
  const [password, setPassword] = useState()
  const [messageId, setMessageId] = useState()

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
              id="btn-create"
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
  loading: state.user.loadingUsers,
  roles: state.roles.roles,
  authConfig: state.user.authConfig
})

export default connect(mapStateToProps, { fetchUsers, fetchRoles, fetchAuthConfig })(List)
