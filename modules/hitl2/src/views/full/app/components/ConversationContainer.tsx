import { Button } from '@blueprintjs/core'
import { EmptyState, lang, Tabs, toast } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, Fragment, useContext } from 'react'

import { EscalationType } from '../../../../types'
import style from '../../style.scss'
import { ApiType } from '../../Api'
import AgentsIcon from '../../Icons/AgentsIcon'
import { Context } from '../Store'

import ConversationHistory from './ConversationHistory'
import Sidebar from './Sidebar'

interface Props {
  api: ApiType
  escalation?: EscalationType
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

  function canAssign() {
    return props.escalation.status === 'pending'
  }

  function canResolve() {
    return props.escalation.status === 'assigned' && props.escalation.agentId === state.currentAgent?.id
  }

  return (
    <Fragment>
      <div className={cx(style.conversationContainer)}>
        <Tabs tabs={[{ id: 'conversation', title: lang.tr('module.hitl2.conversation.tab') }]} />

        {!props.escalation ? (
          <EmptyState icon={<AgentsIcon />} text={lang.tr('module.hitl2.conversation.empty')}></EmptyState>
        ) : (
          <Fragment>
            <div className={cx(style.action)}>
              {canAssign() && <Button onClick={handleAssign}>Assign to me</Button>}
              {canResolve() && <Button onClick={handleResolve}>Resolve</Button>}
            </div>

            <div className={style.conversationHistory}>
              <ConversationHistory api={api} conversationId={props.escalation.userThreadId}></ConversationHistory>
            </div>
          </Fragment>
        )}
      </div>

      {props.escalation && (
        <div className={cx(style.sidebarContainer)}>
          <Tabs tabs={[{ id: 'user', title: lang.tr('module.hitl2.escalation.contactDetails') }]} />
          <Sidebar api={props.api} escalation={props.escalation}></Sidebar>
        </div>
      )}
    </Fragment>
  )
}

export default ConversationContainer
