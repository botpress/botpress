import { Intent, Tag } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import React, { FC } from 'react'

import { IAgent } from './../../../../types'

interface Props {
  status: string
}

const EscalationBadge: FC<Props> = props => {
  switch (props.status) {
    case 'resolved':
      return <Tag intent={Intent.NONE}>{lang.tr(`module.hitl2.escalation.status.${props.status}`)}</Tag>
    case 'assigned':
      return <Tag intent={Intent.PRIMARY}>{lang.tr(`module.hitl2.escalation.status.${props.status}`)}</Tag>
    case 'pending':
      return <Tag intent={Intent.WARNING}>{lang.tr(`module.hitl2.escalation.status.${props.status}`)}</Tag>
    default:
      return <Tag>{lang.tr(`module.hitl2.escalation.status.${props.status}`)}</Tag>
  }
}

export default EscalationBadge
