import { Icon } from '@blueprintjs/core'
import _uniqueId from 'lodash/uniqueId'
import { FC, useEffect, useRef, useState } from 'react'
import React from 'react'

import style from './style.scss'

let instances = []

const WarningMessage: FC<{ message: string }> = ({ message }) => {
  const uniqId = useRef('')
  const [currentNumber, setCurrentNumber] = useState(0)

  useEffect(() => {
    uniqId.current = _uniqueId()
    instances.push(uniqId.current)

    return () => {
      instances = instances.filter(id => id !== uniqId.current)
    }
  }, [])

  useEffect(() => {
    setCurrentNumber(instances.indexOf(uniqId.current))
  }, [instances])

  return (
    <div className="warning-container" style={{ marginBottom: `${currentNumber * 60}px` }}>
      <div className={style.warning}>
        <Icon icon="warning-sign" iconSize={20} className={style.warning_icon} />
        <div className={style.warning_text}>{message}</div>
      </div>
    </div>
  )
}

export default WarningMessage
