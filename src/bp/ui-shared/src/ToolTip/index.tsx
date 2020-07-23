import cx from 'classnames'
import React, { Children, cloneElement, FC, Fragment, useEffect, useReducer, useRef } from 'react'

import style from './style.scss'
import { ToolTipProps } from './typings'

export const stateReducer = (state, action) => {
  if (action.type === 'show') {
    return { ...state, visible: true }
  } else if (action.type === 'hide') {
    return { ...state, visible: false, showing: false }
  } else if (action.type === 'updatePosition') {
    return { ...state, ...action.data }
  } else {
    throw new Error(`That action type isn't supported.`)
  }
}

const ToolTip: FC<ToolTipProps> = ({ children, content, position = 'top' }) => {
  const [state, dispatch] = useReducer(stateReducer, {
    visible: false,
    showing: false,
    xClass: '',
    yClass: 'top'
  })
  const elRef = useRef<any>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const { xClass, yClass, showing, visible } = state

  useEffect(() => {
    elRef.current.addEventListener('mouseover', show)
    elRef.current.addEventListener('mouseleave', hide)

    return () => {
      elRef.current.removeEventListener('mouseover', show)
      elRef.current.removeEventListener('mouseleave', hide)
    }
  }, [elRef.current])

  useEffect(() => {
    pastShow()
  }, [visible])

  const visibility = showing ? style.visible : style.hidden

  const elementRect = elRef.current?.getBoundingClientRect()
  const tooltipRect = tooltipRef.current?.getBoundingClientRect()
  const elLeft = elementRect?.left || 0
  const elWidth = elementRect?.width || 0
  const elTop = elementRect?.top || 0
  const elHeight = elementRect?.height || 0
  const tooltipWidth = tooltipRect?.width || 0
  const tooltipHeight = tooltipRect?.height || 0

  console.log(elementRect)

  let left = elLeft + elWidth / 2 - tooltipWidth / 2

  if (xClass === 'left') {
    left = elLeft - tooltipWidth

    if (yClass === 'top' || yClass === 'bottom') {
      left = left + elWidth
    }
  } else if (xClass === 'right') {
    left = elLeft + elWidth

    if (yClass !== 'top' && yClass !== 'bottom') {
      left = left + tooltipWidth
    }
  }

  let top = elTop + elHeight / 2 - tooltipWidth / 2

  if (yClass === 'top') {
    top = elTop - tooltipHeight
  } else if (yClass === 'bottom') {
    top = elTop + elHeight
  }

  console.log(yClass, top, xClass, left)

  const inlineStyle = {
    left: left + 'px',
    top: top + 'px'
  }

  const classNames = {}

  classNames[visibility] = true

  const pastShow = () => {
    const elementRect = elRef.current?.getBoundingClientRect()
    const tooltipRect = tooltipRef.current?.getBoundingClientRect()

    if (tooltipRect) {
      const docWidth = document.documentElement.clientWidth,
        docHeight = document.documentElement.clientHeight

      const rx = elementRect.x + elementRect.width // most right x
      const lx = elementRect.x // most left x
      const ty = elementRect.y // most top y
      const by = elementRect.y + elementRect.height // most bottom y
      const overflowYMiddle = (tooltipRect.height - elementRect.height) / 2

      let overflowXMiddle = (tooltipRect.width - elementRect.width) / 2
      overflowXMiddle = overflowXMiddle < 0 ? 0 : overflowXMiddle

      const canBeXMiddle = rx + overflowXMiddle <= docWidth && lx - overflowXMiddle >= 0
      const canBeRight = rx + tooltipRect.width <= docWidth
      const canBeLeft = lx - tooltipRect.width >= 0
      const canBeYMiddle = ty - overflowYMiddle >= 0 && by + overflowYMiddle <= docHeight
      const canBeAbove = ty - tooltipRect.height >= 0
      const canBeBellow = by + tooltipRect.height <= docHeight

      let xClass
      let yClass

      const checkXPosition = () => {
        if (!canBeXMiddle) {
          if (canBeLeft) {
            return 'left'
          } else {
            return 'right'
          }
        }

        return ''
      }

      const checkYPosition = () => {
        if (!canBeYMiddle) {
          if (canBeAbove) {
            return 'top'
          } else {
            return 'bottom'
          }
        }

        return ''
      }

      switch (position) {
        case 'top':
          yClass = 'top'

          if (!canBeAbove) {
            yClass = 'bottom'
          }
          xClass = checkXPosition()
          break
        case 'bottom':
          yClass = 'bottom'

          if (!canBeBellow) {
            yClass = 'top'
          }
          xClass = checkXPosition()
          break
        case 'left':
          xClass = 'left'

          if (!canBeLeft) {
            xClass = 'right'
          }
          yClass = checkYPosition()
          break
        case 'right':
          xClass = 'right'

          if (!canBeRight) {
            xClass = 'left'
          }
          yClass = checkYPosition()
          break
      }

      dispatch({ type: 'updatePosition', data: { xClass, yClass, showing: true } })
    }
  }

  const show = () => {
    dispatch({ type: 'show' })
  }
  const hide = () => {
    dispatch({ type: 'hide' })
  }

  return (
    <Fragment>
      {cloneElement(Children.only(children), { ref: el => (elRef.current = el) })}

      {visible && (
        <div
          ref={tooltipRef}
          id="botpress-tooltip"
          className={cx(style.tooltip, classNames, xClass, yClass)}
          style={inlineStyle}
        >
          <div className="tooltipArrow"></div>
          <div className="tooltipInner">{content}</div>
        </div>
      )}
    </Fragment>
  )
}

export default ToolTip
