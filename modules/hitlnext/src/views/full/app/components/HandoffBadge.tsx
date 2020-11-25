import { Intent, Tag } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import React, { FC } from 'react'

interface Props {
  status: string
}

const statusIntents = { resolved: Intent.NONE, assigned: Intent.PRIMARY, pending: Intent.WARNING }

const HandoffBadge: FC<Props> = ({ status }) => {
  return <Tag intent={statusIntents[status]}>{lang.tr(`module.hitlnext.handoff.status.${status}`)}</Tag>
}

export default HandoffBadge
