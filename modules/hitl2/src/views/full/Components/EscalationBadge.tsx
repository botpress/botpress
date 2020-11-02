import { Tag, Intent } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import React, { FC } from 'react'

import { AgentType } from './../../../types'

interface Props {
  status: string
  assignedToAgent: Partial<AgentType>
  currentAgent?: AgentType
}

const EscalationBadge: FC<Props> = props => {
  switch (props.status) {
    case 'resolved':
      return <Tag intent={Intent.SUCCESS}>{lang.tr(`module.hitl2.escalation.status.${props.status}`)}</Tag>
    case 'assigned':
      if (props.assignedToAgent?.id === props.currentAgent?.id) {
        return <Tag intent={Intent.PRIMARY}>{lang.tr('module.hitl2.escalation.assignment.me')}</Tag>
      } else {
        return (
          <Tag>{lang.tr('module.hitl2.escalation.assignment.other', { name: props.assignedToAgent?.fullName })}</Tag>
        )
      }
    default:
      return <Tag intent={Intent.WARNING}>{lang.tr(`module.hitl2.escalation.status.${props.status}`)}</Tag>
  }
}

export default EscalationBadge
