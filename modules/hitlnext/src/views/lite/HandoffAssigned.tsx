import React, { Fragment, useEffect, useState } from 'react'

import lang from '../lang'

import style from './style.scss'

export const HandoffAssigned = props => {
  const [isLangInit, setLangInit] = useState(false)

  useEffect(() => {
    lang.init()
    setTimeout(() => {
      setLangInit(true)
    }, 400) // hack to make sure translations are initialized
  }, [])

  // TODO display 10 history messages and a load more button
  const trKey = props.from === 'agent' ? 'assignedToAgent' : 'assignedToYou'
  return (
    <Fragment>
      {isLangInit && <div className={style.handoffAssigned}>{lang.tr(`module.hitlnext.handoff.${trKey}`)}</div>}
    </Fragment>
  )
}
