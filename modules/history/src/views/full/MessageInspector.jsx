import React, { useState, useEffect } from 'react'
import style from './style.scss'

import inspectorTheme from './inspectortheme'
import JSONTree from 'react-json-tree'
import { Collapse, Icon } from '@blueprintjs/core'

export const MessageInspector = props => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setIsOpen(true)
  }, [props.focusedMessage])

  return (
    <div className={style.inspector}>
      <span onClick={() => setIsOpen(!isOpen)} style={{ cursor: 'pointer' }}>
        {isOpen && <Icon icon="caret-down" />}
        {!isOpen && <Icon icon="caret-up" />}
        Toggle Inspector
      </span>

      <Collapse isOpen={isOpen}>
        <JSONTree theme={inspectorTheme} data={props.focusedMessage || {}} invertTheme={false} hideRoot={true} />
      </Collapse>
    </div>
  )
}
