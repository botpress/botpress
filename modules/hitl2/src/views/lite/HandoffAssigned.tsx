import React, { Fragment, useEffect, useState } from 'react'

import lang from '../lang'

import style from './style.scss'

// this is wraped in a div
export const HandoffAssigned = props => {
  const [isInit, setIsInit] = useState(false)

  useEffect(() => {
    lang.init()
    setIsInit(true)
  }, [])

  // TODO display history messages and a load more button
  return <div className={style.handoffAssigned}>{isInit && lang.tr('module.hitl2.escalation.assignedToYou')}</div>
}
