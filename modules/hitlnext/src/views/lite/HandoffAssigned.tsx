import React, { Fragment, useEffect, useState } from 'react'

import lang from '../lang'

import style from './style.scss'

// this is wraped in a div
export const HandoffAssigned = props => {
  const [isLangInit, setLangInit] = useState(false)

  useEffect(() => {
    lang.init()
    setTimeout(() => {
      setLangInit(true)
    }, 500) // hack to make sure translations are initialized
  }, [])

  // TODO display history messages and a load more button
  const trKey = props.forAgent ? 'assignedToYou' : 'assignedToAgent'
  debugger
  return (
    <Fragment>
      {isLangInit && <div className={style.handoffAssigned}>{lang.tr(`module.hitlnext.escalation.${trKey}`)}</div>}
    </Fragment>
  )
}
