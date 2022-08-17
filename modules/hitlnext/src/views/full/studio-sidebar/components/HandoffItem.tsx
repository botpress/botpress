import { lang } from 'botpress/shared'
import cx from 'classnames'
import moment from 'moment'
import ms from 'ms'
import React, { FC, useEffect, useState } from 'react'

import { IHandoff } from '../../../../types'
import styles from '../../style.scss'

const HandoffItem: FC<IHandoff> = props => {
  moment.locale(lang.getLocale())
  const [fromNow, setFromNow] = useState(moment(props.createdAt).fromNow())
  useEffect(() => {
    const refreshRate = ms('1m')

    const interval = setInterval(() => {
      setFromNow(moment(props.createdAt).fromNow())
    }, refreshRate)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={cx(styles.handoffItem)}>
      <p>#{props.id}</p>
      <p className="bp3-text-small bp3-text-muted">
        {props.status} ⋅ {lang.tr('module.hitlnext.handoff.created', { date: fromNow })}
      </p>
    </div>
  )
}

export default HandoffItem
