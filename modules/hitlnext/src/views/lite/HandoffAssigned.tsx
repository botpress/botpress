import React, { Fragment, useEffect, useState } from 'react'

import lang from '../lang'

import style from './style.scss'
import MessageList from './MessageList'

async function initLang(): Promise<void> {
  return new Promise(resolve => {
    lang.init()
    setTimeout(resolve, 100) // hack to make sure translations are initialized before 1st rendering
  })
}

export const HandoffAssignedForAgent = props => {
  const [isLangInit, setLangInit] = useState(false)

  useEffect(() => {
    // tslint:disable-next-line: no-floating-promises
    initLang().then(() => setLangInit(true))
  }, [])

  // TODO render a load more button to load more of message history
  return (
    <Fragment>
      <MessageList events={props.recentEvents || []} />
      {isLangInit && <div className={style.handoffAssigned}>{lang.tr('module.hitlnext.handoff.assignedToYou')}</div>}
    </Fragment>
  )
}

export const HandoffAssignedForUser = () => {
  const [isLangInit, setLangInit] = useState(false)

  useEffect(() => {
    // tslint:disable-next-line: no-floating-promises
    initLang().then(() => setLangInit(true))
  }, [])

  // TODO render agent name
  return <Fragment>{isLangInit && <span>{lang.tr('module.hitlnext.handoff.assignedToAgent')}</span>}</Fragment>
}
