import React from 'react'
import style from './style.scss'

import inspectorTheme from './inspectortheme'
import JSONTree from 'react-json-tree'

export const MessageInspector = props => {
  return (
    <div>
      <h5>
        <strong>Inspect Event Details</strong>
      </h5>
      <div className={style.inspector}>
        <JSONTree theme={inspectorTheme} data={props.focusedMessage || {}} invertTheme={true} hideRoot={true} />
      </div>
    </div>
  )
}
