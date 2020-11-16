import { Button, Icon } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import { isOperationAllowed, lang, MainLayout, PermissionOperation, toast } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, Fragment, useContext } from 'react'

import style from '../../style.scss'
import { ApiType } from '../../Api'
import { Context } from '../Store'

import ConversationDetails from './ConversationDetails'
import ConversationHistory from './ConversationHistory'
import LiveChat from './LiveChat'

interface Props {
  bp: typeof sdk
  api: ApiType
}

const ConversationContainer: FC<Props> = props => {
  const { api } = props

  const { state, dispatch } = useContext(Context)

  async function handleAssign() {
    try {
      const escalation = await api.assignEscalation(state.currentEscalation.id)
      toast.success(lang.tr('module.hitl2.escalation.assigned', { id: escalation.id }))
    } catch (error) {
      dispatch({ type: 'setError', payload: error })
    }
  }

  async function handleResolve() {
    try {
      const escalation = await api.resolveEscalation(state.currentEscalation.id)
      toast.success(lang.tr('module.hitl2.escalation.resolved', { id: escalation.id }))
    } catch (error) {
      dispatch({ type: 'setError', payload: error })
    }
  }

  function currentAgentHasPermission(operation: PermissionOperation): boolean {
    return isOperationAllowed({ user: state.currentAgent, resource: 'module.hitl2', operation })
  }

  const shouldRenderLiveChat =
    state.currentAgent.online &&
    state.currentEscalation?.status === 'assigned' &&
    state.currentEscalation?.agentId === state.currentAgent.agentId

  const liveChatButton = (
    <Button
      className={style.coversationButton}
      minimal
      rightIcon="tick-circle"
      onClick={handleResolve}
      text={lang.tr('module.hitl2.escalation.resolve')}
    />
  )

  const historyButton = (
    <Button
      className={style.coversationButton}
      minimal
      rightIcon="following"
      disabled={
        !(
          state.currentEscalation?.status === 'pending' &&
          currentAgentHasPermission('write') &&
          state.currentAgent.online
        )
      }
      onClick={handleAssign}
      text={lang.tr('module.hitl2.escalation.assign')}
    />
  )

  const content = shouldRenderLiveChat ? (
    <LiveChat escalation={state.currentEscalation} currentAgent={state.currentAgent} />
  ) : (
    <ConversationHistory bp={props.bp} api={api} conversationId={state.currentEscalation.userThreadId} />
  )
  return (
    <Fragment>
      <div className={cx(style.column, style.liveConversation)}>
        <MainLayout.Toolbar
          className={style.hitlToolBar}
          tabs={[{ id: 'conversation', title: lang.tr('module.hitl2.conversation.tab') }]}
          buttons={[{ content: shouldRenderLiveChat ? liveChatButton : historyButton }]}
        />
        {content}
      </div>
      <ConversationDetails api={props.api} escalation={state.currentEscalation}></ConversationDetails>
    </Fragment>
  )
}

export default ConversationContainer
