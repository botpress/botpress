import React, { FC, useEffect, useState } from 'react'

import { EscalationType } from '../../../../types'
import cx from 'classnames'
import { lang } from 'botpress/shared'
import moment from 'moment'
import styles from './../../style.scss'

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
    <div className={cx(styles.escalationItem)}>
      <p>#{props.id}</p>
      <p className="bp3-text-small bp3-text-muted">
        {props.status} ⋅ {lang.tr('module.hitl2.escalation.created', { date: fromNow })}
      </p>
    </div>
  )
}

export default EscalationItem
