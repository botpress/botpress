import { Button } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import { EmptyState, isOperationAllowed, lang, PermissionOperation, Tabs, toast } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, Fragment, useContext } from 'react'

import { AgentType, EscalationType, UserProfile } from '../../../../types'
import style from '../../style.scss'
import { ApiType } from '../../Api'
import AgentsIcon from '../../Icons/AgentsIcon'
import { Context } from '../Store'

import ConversationHistory from './ConversationHistory'
import LiveChat from './LiveChat'
import Sidebar from './Sidebar'

interface Props {
  bp: typeof sdk
  api: ApiType
  escalation?: EscalationType
  currentAgent: AgentType
}

const ConversationContainer: FC<Props> = props => {
  const { api } = props

  const { state, dispatch } = useContext(Context)

  async function handleAssign() {
    try {
      const escalation = await api.assignEscalation(props.escalation.id)
      toast.success(lang.tr('module.hitl2.escalation.assign', { id: escalation.id }))
    } catch (error) {
      if (_.inRange(_.get(error, 'response.status'), 400, 499)) {
        toast.failure(error.response.data.errors[0].detail)
      } else {
        dispatch({ type: 'setError', payload: error })
      }
    }
  }

  async function handleResolve() {
    try {
      const escalation = await api.resolveEscalation(props.escalation.id)
      toast.success(lang.tr('module.hitl2.escalation.resolve', { id: escalation.id }))
    } catch (error) {
      if (_.inRange(_.get(error, 'response.status'), 400, 499)) {
        toast.failure(error.response.data.errors[0].detail)
      } else {
        dispatch({ type: 'setError', payload: error })
      }
    }
  }

  function currentAgentHasReadAccess(): boolean {
    return isOperationAllowed({ user: props.currentAgent as UserProfile, resource: 'module.hitl2', operation: 'read' })
  }

  function currentAgentHasPermission(operation: PermissionOperation): boolean {
    return isOperationAllowed({ user: props.currentAgent as UserProfile, resource: 'module.hitl2', operation })
  }

  function canAssign(): boolean {
    return props.escalation?.status === 'pending' && currentAgentHasPermission('write') && props.currentAgent.online
  }

  // TODO extract this as a component
  function renderConversationHistory() {
    return (
      <Fragment>
        {canAssign() && (
          <div className={cx(style.action)}>
            <Button onClick={handleAssign}>{lang.tr('module.hitl.assignToMe')}</Button>
          </div>
        )}

        <div className={style.conversationHistory}>
          <ConversationHistory bp={props.bp} api={api} conversationId={props.escalation.userThreadId} />
        </div>
      </Fragment>
    )
  }

  function renderLiveChat() {
    return (
      <Fragment>
        <div className={cx(style.action)}>
          <Button onClick={handleResolve}>{lang.tr('module.hitl.resolve')}</Button>
        </div>
        <LiveChat escalation={props.escalation} />
        <div className={cx(style.sidebarContainer)}>
          <Tabs tabs={[{ id: 'user', title: lang.tr('module.hitl2.escalation.contactDetails') }]} />
          <Sidebar api={props.api} escalation={props.escalation}></Sidebar>
        </div>
      </Fragment>
    )
  }

  const shouldRenderHistory =
    props.escalation && props.escalation?.agentId !== props.currentAgent.id && currentAgentHasReadAccess()
  const shouldRenderLiveChat =
    props.escalation?.status === 'assigned' && props.escalation?.agentId === props.currentAgent.id
  return (
    <Fragment>
      <div className={cx(style.conversationContainer)}>
        <Tabs tabs={[{ id: 'conversation', title: lang.tr('module.hitl2.conversation.tab') }]} />

        {!props.escalation && (
          <EmptyState icon={<AgentsIcon />} text={lang.tr('module.hitl2.conversation.empty')}></EmptyState>
        )}
        {shouldRenderHistory && renderConversationHistory()}
        {shouldRenderLiveChat && renderLiveChat()}
        {/* {props.escalation && props.escalation?.agentId === props.currentAgent.id} */}
      </div>
    </Fragment>
  )
}

export default ConversationContainer
