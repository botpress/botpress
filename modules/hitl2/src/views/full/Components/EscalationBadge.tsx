import React, { FC } from 'react'

import { AgentType } from './../../../types'

import { Tag } from '@blueprintjs/core'
import { lang } from 'botpress/shared'

interface Props {
  status: string
  assignedToAgent: Partial<AgentType>
  currentAgent?: AgentType
}

const EscalationBadge: FC<Props> = props => {
  switch (props.status) {
    case 'assigned':
      if (props.assignedToAgent.id == props.currentAgent?.id) {
        return <Tag intent="primary">{lang.tr('module.hitl2.escalation.assignment.me')}</Tag>
      } else {
        return (
          <Tag intent="none">
            {lang.tr('module.hitl2.escalation.assignment.other', { name: props.assignedToAgent.fullName })}
          </Tag>
        )
      }
    case 'resolved':
      return <Tag intent="success">{lang.tr(`module.hitl2.escalation.status.${props.status}`)}</Tag>
    default:
      return <Tag>{lang.tr(`module.hitl2.escalation.status.${props.status}`)}</Tag>
  }
}

export default EscalationBadge
