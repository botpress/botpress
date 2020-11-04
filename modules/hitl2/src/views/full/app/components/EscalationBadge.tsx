import { Intent, Tag } from '@blueprintjs/core'
import React, { FC } from 'react'

import { AgentType } from './../../../../types'
import { lang } from 'botpress/shared'

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
      return <Tag intent={Intent.PRIMARY}>{lang.tr(`module.hitl2.escalation.status.${props.status}`)}</Tag>
    case 'pending':
      return <Tag intent={Intent.WARNING}>{lang.tr(`module.hitl2.escalation.status.${props.status}`)}</Tag>
    default:
      return <Tag>{lang.tr(`module.hitl2.escalation.status.${props.status}`)}</Tag>
  }
}

export default EscalationBadge
