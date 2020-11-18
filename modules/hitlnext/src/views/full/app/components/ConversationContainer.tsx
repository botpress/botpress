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
      const handoff = await api.assignHandoff(state.currentHandoff.id)
      toast.success(lang.tr('module.hitlnext.handoff.assigned', { id: handoff.id }))
    } catch (error) {
      dispatch({ type: 'setError', payload: error })
    }
  }

  async function handleResolve() {
    try {
      const handoff = await api.resolveHandoff(state.currentHandoff.id)
      toast.success(lang.tr('module.hitlnext.handoff.resolved', { id: handoff.id }))
    } catch (error) {
      dispatch({ type: 'setError', payload: error })
    }
  }

  function currentAgentHasPermission(operation: PermissionOperation): boolean {
    return isOperationAllowed({ user: state.currentAgent, resource: 'module.hitlnext', operation })
  }

  const shouldRenderLiveChat =
    state.currentAgent.online &&
    state.currentHandoff?.status === 'assigned' &&
    state.currentHandoff?.agentId === state.currentAgent.agentId

  const liveChatButtons = () => [
    {
      content: (
        <Button
          className={style.coversationButton}
          minimal
          rightIcon="tick-circle"
          onClick={handleResolve}
          text={lang.tr('module.hitlnext.handoff.resolve')}
        />
      )
    }
  ]

  const historyButtons = () => [
    {
      content: (
        <Button
          className={style.coversationButton}
          minimal
          rightIcon="following"
          disabled={
            !(
              state.currentHandoff?.status === 'pending' &&
              currentAgentHasPermission('write') &&
              state.currentAgent.online
            )
          }
          onClick={handleAssign}
          text={lang.tr('module.hitlnext.handoff.assign')}
        />
      )
    }
  ]

  const content = shouldRenderLiveChat ? (
    <LiveChat handoff={state.currentHandoff} currentAgent={state.currentAgent} />
  ) : (
    <ConversationHistory bp={props.bp} api={api} conversationId={state.currentHandoff.userThreadId} />
  )
  return (
    <Fragment>
      <div className={cx(style.column, style.liveConversation)}>
        <MainLayout.Toolbar
          className={style.hitlToolBar}
          tabs={[{ id: 'conversation', title: lang.tr('module.hitlnext.conversation.tab') }]}
          buttons={shouldRenderLiveChat ? liveChatButtons() : historyButtons()}
        />
        {content}
      </div>
      <ConversationDetails api={props.api} handoff={state.currentHandoff}></ConversationDetails>
    </Fragment>
  )
}

export default ConversationContainer
