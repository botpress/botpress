import { lang } from 'botpress/shared'
import classnames from 'classnames'
import { parseActionInstruction } from 'common/action'
import React, { FC, useState } from 'react'
import { Overlay, Popover } from 'react-bootstrap'
import ReactDOM from 'react-dom'

import style from './style.scss'

interface Props {
  text: string
  className: string
}

export const ActionPopover: FC<Props> = props => {
  const [show, setShow] = useState<boolean>(false)
  const [target, setTarget] = useState<HTMLElement>(null)

  const actionInstruction = parseActionInstruction(props.text.trim())
  const actionName = `${actionInstruction.actionName} (args)`

  let callPreview: string
  if (actionInstruction.argsStr) {
    try {
      const parameters = JSON.parse(actionInstruction.argsStr)
      callPreview = JSON.stringify(parameters, null, 2)
    } catch (err) {
      console.error('[ActionPopover] Error parsing instructions:', err)
      callPreview = lang.tr('studio.flow.node.actionInstructionParsingError', { msg: err.message })
    }
  }

  const hidePopover = () => {
    setShow(false)
  }

  const showPopover = () => {
    setShow(true)
  }

  return (
    <div onMouseLeave={hidePopover}>
      <div
        className={classnames(props.className, style['fn'], style['action-item'])}
        ref={setTarget}
        onMouseEnter={showPopover}
      >
        <span className={style.icon}>⚡</span>
        <span className={style.name}>{actionName}</span>
        {props.children}
      </div>

      <Overlay target={() => ReactDOM.findDOMNode(target)} placement="top" show={show}>
        <Popover id="popover-action" title={`⚡ ${actionName}`}>
          {lang.tr('studio.flow.node.actionArguments')}
          <pre>{callPreview}</pre>
        </Popover>
      </Overlay>
    </div>
  )
}
