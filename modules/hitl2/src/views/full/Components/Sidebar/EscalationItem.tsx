import React, { FC, useState, useEffect } from 'react'
import moment from 'moment'

import { EscalationType } from '../../../../types'

import { lang } from 'botpress/shared'

const EscalationItem: FC<EscalationType> = props => {
  const [fromNow, setFromNow] = useState(moment(props.createdAt).fromNow())

  useEffect(() => {
    const refreshRate = 1000 * 60 // ms

    const interval = setInterval(() => {
      setFromNow(moment(props.createdAt).fromNow())
    }, refreshRate)
    return () => clearInterval(interval)
  }, [])

  return (
    <li>
      <p>Id: {props.id}</p>
      <p className="bp3-text-small bp3-text-muted">{lang.tr('module.hitl2.escalation.created', { date: fromNow })}</p>
      <p>From: {props.userConversation.channel}</p>
    </li>
  )
}

export default EscalationItem
