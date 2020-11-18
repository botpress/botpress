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
    }, 400) // hack to make sure translations are initialized
  }, [])

  const forAgent = props.from !== 'agent'

  return (
    <Fragment>
      {forAgent && <MessageList events={props.recentEvents || []} />}
      {isLangInit && props.from === 'agent' && <span>{lang.tr('module.hitlnext.handoff.assignedToAgent')}</span>}
      {isLangInit && props.from !== 'agent' && (
        <div className={style.handoffAssigned}>{lang.tr('module.hitlnext.handoff.assignedToYou')}</div>
      )}
    </Fragment>
  )
}
