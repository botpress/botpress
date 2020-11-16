import { ContentSection, lang } from 'botpress/shared'
import moment from 'moment'
import React, { FC, useContext } from 'react'

import { IComment } from '../../../../types'
import style from '../../style.scss'
import { Context } from '../Store'

const Comment: FC<IComment> = props => {
  const { state } = useContext(Context)

  function formatDate(str) {
    return moment(str).format('DD/MM/YYYY')
  }

  function agentName() {
    const agent = state.agents[props.agentId]
    if (state.currentAgent?.agentId === props.agentId) {
      return lang.tr('module.hitl2.escalation.you')
    }

    const displayName = [agent.attributes.firstname, agent.attributes.lastname].filter(Boolean).join(' ')
    return displayName || agent.email
  }

  return (
    <ContentSection title={`#${props.escalationId}`}>
      <ul>
        <li>{props.content}</li>
      </ul>
      <p className={style.createdDate}>
        {formatDate(props.createdAt)} <span>⋅</span> {agentName()}
      </p>
    </ContentSection>
  )
}

export default Comment
