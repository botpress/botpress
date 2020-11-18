import React, { Fragment, useEffect, useState } from 'react'

import lang from '../lang'

import style from './style.scss'
import MessageList from './MessageList'

export const HandoffAssigned = props => {
  const [isLangInit, setLangInit] = useState(false)

  useEffect(() => {
    lang.init()
    setTimeout(() => {
      setLangInit(true)
    }, 10) // hack to make sure translations are initialized
  }, [])

  return (
    <Fragment>
      {props.forAgent && <MessageList events={props.recentEvents || []} />}
      {isLangInit && !props.forAgent && <span>{lang.tr('module.hitlnext.handoff.assignedToAgent')}</span>}
      {isLangInit && props.forAgent && (
        <div className={style.handoffAssigned}>{lang.tr('module.hitlnext.handoff.assignedToYou')}</div>
      )}
    </Fragment>
  )
}
