import { Button } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import { CHAT_USER_ROLE } from 'common/defaults'
import { AuthStrategyConfig } from 'common/typings'
import React, { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { AppState } from '~/reducers'
import PageContainer from '~/App/PageContainer'
import SplitPage from '~/App/SplitPage'
import { getActiveWorkspace } from '~/Auth'
import RolloutStrategyModal from '~/Pages/Workspaces/RolloutStrategyModal'

import { fetchAuthConfig, fetchUsers } from '../../../../reducers/user'
import CreateUserModal from '../CreateUserModal'
import ShowInfoModal from '../ShowInfoModal'
import UserList from '../UserList'

import RolloutOverview from './RolloutOverview'

interface Props {
  fetchUsers: (filterRole?: string) => void
  fetchAuthConfig: () => void
  authConfig?: AuthStrategyConfig[]
}

const List: FC<Props> = props => {
  useEffect(() => {
    reloadUsers()
    !props.authConfig && props.fetchAuthConfig()
  }, [])

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [rolloutModalOpen, setRolloutModalOpen] = useState(false)
  const [email, setEmail] = useState()
  const [password, setPassword] = useState()
  const [messageId, setMessageId] = useState()

  const reloadUsers = () => {
    props.fetchUsers(CHAT_USER_ROLE.id)
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

  const workspaceId = getActiveWorkspace() || 'default'

  return (
    <PageContainer
      title={lang.tr('admin.workspace.users.chatUsers')}
      helpText={lang.tr('admin.workspace.users.chatUsersHelp')}
    >
      <SplitPage
        sideMenu={
          <div>
            <Button
              id="btn-create"
              style={{ width: 160 }}
              text={lang.tr('admin.workspace.users.addChatUser')}
              icon="add"
              onClick={() => setCreateModalOpen(true)}
            />
            <br />
            <br />
            <Button
              id="btn-rollout"
              style={{ width: 160 }}
              text={lang.tr('admin.workspace.users.configureRollout')}
              icon="send-to-graph"
              onClick={() => setRolloutModalOpen(true)}
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

            <RolloutStrategyModal
              workspaceId={workspaceId}
              isOpen={rolloutModalOpen}
              toggle={() => setRolloutModalOpen(!rolloutModalOpen)}
            />
          </div>
        }
      >
        <div>
          <RolloutOverview />
          <UserList onPasswordReset={onPasswordReset} onUserUpdated={reloadUsers} />
        </div>
      </SplitPage>
    </PageContainer>
  )
}

const mapStateToProps = (state: AppState) => ({
  loading: state.user.loadingUsers,
  authConfig: state.user.authConfig
})

export default connect(mapStateToProps, { fetchUsers, fetchAuthConfig })(List)
