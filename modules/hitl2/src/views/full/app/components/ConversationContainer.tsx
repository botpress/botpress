import { Button } from '@blueprintjs/core'
import { EmptyState, lang, Tabs, toast } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, Fragment, useContext } from 'react'

import { EscalationType } from '../../../../types'
import { Context } from '../Store'
import { ApiType } from '../../Api'

import style from '../../style.scss'
import AgentsIcon from '../../Icons/AgentsIcon'
import Sidebar from './Sidebar'

interface Props {
  api: ApiType
  escalation?: EscalationType
}

const ConversationContainer: FC<Props> = props => {
  const { state, dispatch } = useContext(Context)
  const { api } = props

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

  return (
    <Fragment>
      <div className={style.conversationWrapper}>
        <Tabs tabs={[{ id: 'conversation', title: lang.tr('module.hitl2.conversation.tab') }]} />
        <div className={style.h100}>
          {!props.escalation ? (
            <EmptyState icon={<AgentsIcon />} text={lang.tr('module.hitl2.conversation.empty')}></EmptyState>
          ) : (
            <Fragment>
              <Button onClick={handleAssign}>Assign to me</Button>
              <Button onClick={handleResolve}>Resolve</Button>
            </Fragment>
          )}
        </div>
      </div>

      {props.escalation && (
        <div className={style.sidebarWrapper}>
          <Tabs tabs={[{ id: 'user', title: lang.tr('module.hitl2.escalation.contactDetails') }]} />
          <Sidebar api={props.api} escalation={props.escalation}></Sidebar>
        </div>
      )}
    </Fragment>
  )
}

export default ConversationContainer
