import React, { FC, useRef } from 'react'

import style from './style.scss'
import { TooltipProps } from './typings'
import { addTooltip, getUpdatedPosition, removeTooltip, updateTooltip } from './util'

const defaultState = {
  visible: false,
  position: { x: 0, y: 0 },
  type: 'none'
}

const stateReducer = (state, action) => {
  if (action.type === 'resetData') {
    removeTooltip()

    return {
      ...defaultState
    }
  } else if (action.type === 'setData') {
    return {
      ...action.data
    }
  } else {
    throw new Error(`That action type isn't supported.`)
  }
}

const Tooltip: FC<TooltipProps> = props => {
  const elementRef = useRef<HTMLDivElement>(null)
  const parentRef = useRef<HTMLDivElement>(null)
  const [state, dispatch] = React.useReducer(stateReducer, {
    ...defaultState
  })

  const { position, type, visible } = state
  const { content } = props

  const pastShow = () => {
    if (elementRef.current && parentRef.current) {
      const { position, type } = getUpdatedPosition(elementRef.current, parentRef.current)

      updateTooltip({ position, type, elementRef, content })
      dispatch({
        type: 'setData',
        data: {
          type,
          position,
          visible: true
        }
      })
    }
  }

  const handlerMouseOver = () => {
    if (!visible) {
      addTooltip({ position, type, elementRef, content })
    }

    pastShow()
  }

  const handleOnMouseLeave = evt => {
    dispatch({ type: 'resetData' })
  }

  return (
    <div
      className={style.tooltipedElement}
      ref={parentRef}
      onMouseOver={handlerMouseOver}
      onMouseLeave={handleOnMouseLeave}
    >
      {props.children}
    </div>
  )
}

export default Tooltip
