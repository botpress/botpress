import { Button } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import { CHAT_USER_ROLE } from 'common/defaults'
import React, { FC, useEffect, useState } from 'react'
import { connect, ConnectedProps } from 'react-redux'

import PageContainer from '~/app/common/PageContainer'
import SplitPage from '~/app/common/SplitPage'
import { AppState } from '~/app/rootReducer'
import { getActiveWorkspace } from '~/auth/basicAuth'
import { fetchAuthConfig } from '~/auth/reducer'
import { fetchUsers } from '~/workspace/collaborators/reducer'
import RolloutStrategyModal from '~/workspace/workspaces/RolloutStrategyModal'
import CreateUserModal from '../CreateUserModal'
import ShowInfoModal from '../ShowInfoModal'
import UserList from '../UserList'

import RolloutOverview from './RolloutOverview'

type Props = ConnectedProps<typeof connector>

const List: FC<Props> = props => {
  useEffect(() => {
    reloadUsers()
    !props.authConfig && props.fetchAuthConfig()
  }, [])

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [rolloutModalOpen, setRolloutModalOpen] = useState(false)
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [messageId, setMessageId] = useState<any>()

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
              id="btn-create-chat-user"
              style={{ width: 160 }}
              text={lang.tr('admin.workspace.users.addChatUser')}
              icon="add"
              onClick={() => setCreateModalOpen(true)}
            />
            <br />
            <br />
            <Button
              id="btn-rollout-chat-user"
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
  loading: state.collaborators.loading,
  authConfig: state.auth.authConfig
})

const connector = connect(mapStateToProps, { fetchUsers, fetchAuthConfig })

export default connector(List)
