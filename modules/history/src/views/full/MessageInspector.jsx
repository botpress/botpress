import React from 'react'
import style from './style.scss'

import { GoX } from 'react-icons/go'

import classnames from 'classnames'
import inspectorTheme from './inspectortheme'
import JSONTree from 'react-json-tree'

export function MessageInspector(props) {
  return (
    <div
      className={classnames(style['message-inspector'], {
        [style['message-inspector-hidden']]: props.inspectorIsShown
      })}
    >
      <div className={style['quit-inspector']} onClick={props.closeInspector}>
        <GoX />
      </div>
      {props.currentlyFocusedMessage && (
        <JSONTree theme={inspectorTheme} data={props.currentlyFocusedMessage} invertTheme={false} hideRoot={true} />
      )}
    </div>
  )
}
