// @ts-nocheck
import cx from 'classnames'
import _uniqueId from 'lodash/uniqueId'
import React, { Children, cloneElement, FC, useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'

import style from './style.scss'
import { ToolTipProps } from './typings'

const getPositions = (positionClasses, el, tooltip) => {
  const { xClass, yClass } = positionClasses
  const elementRect = el?.getBoundingClientRect()
  const tooltipRect = tooltip?.getBoundingClientRect()
  const elLeft = elementRect?.left || 0
  const elWidth = elementRect?.width || 0
  const elTop = elementRect?.top || 0
  const elHeight = elementRect?.height || 0
  const tooltipWidth = tooltipRect?.width || 0
  const tooltipHeight = tooltipRect?.height || 0

  let left = elLeft + elWidth / 2 - tooltipWidth / 2

  if (xClass === 'left') {
    left = elLeft - tooltipWidth

    if (yClass === 'top' || yClass === 'bottom') {
      left = left + elWidth
    }
  } else if (xClass === 'right') {
    left = elLeft

    if (yClass !== 'top' && yClass !== 'bottom') {
      left = elLeft + elWidth
    }
  }

  let top = elTop + elHeight / 2 - tooltipHeight / 2

  if (yClass === 'top') {
    top = elTop - tooltipHeight
  } else if (yClass === 'bottom') {
    top = elTop + elHeight
  }

  return { left, top }
}

const tipPosition = (positionClasses, el) => {
  const { xClass, yClass } = positionClasses
  const elementRect = el?.getBoundingClientRect()
  const elWidth = elementRect?.width || 0

  let left = 'auto'
  let right = 'auto'

  if (xClass === 'left' && (yClass === 'top' || yClass === 'bottom')) {
    right = `${elWidth / 2 - 5}px`
  } else if (xClass === 'right' && (yClass === 'top' || yClass === 'bottom')) {
    left = `${elWidth / 2 - 5}px`
  } else if (!xClass) {
    left = '50%'
  }

  return { left, right }
}

const ToolTip: FC<ToolTipProps> = ({ childId, children, content, position = 'top', hoverOpenDelay }) => {
  if (!content) {
    return children
  }

  const id = useRef(`botpress-tooltip-${_uniqueId()}`)
  const timeout = useRef(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)

  const pastShow = el => {
    const elementRect = el?.getBoundingClientRect()
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

      const { left, top } = getPositions({ xClass, yClass }, el, tooltipRef.current)
      const tipPos = tipPosition({ xClass, yClass }, el)

      const inlineStyle = {
        left: `${left}px`,
        top: `${top}px`
      }

      setTimeout(() => {
        tooltipRef.current.classList.add(style.visible)
        if (xClass) {
          tooltipRef.current.classList.add(xClass)
        }
        if (yClass) {
          tooltipRef.current.classList.add(yClass)
        }

        tooltipRef.current.style.left = inlineStyle.left
        tooltipRef.current.style.top = inlineStyle.top
        tipRef.current.style.left = tipPos.left
        tipRef.current.style.right = tipPos.right
      }, hoverOpenDelay || 0)
    }
  }

  const show = e => {
    document.addEventListener('mousemove', mouseMove)
    clearTimeout(timeout.current)
    handleHtmlRendering()
    pastShow(e.currentTarget)
  }

  const mouseMove = e => {
    if (!e.target?.closest(`#${childId || `${id.current}-trigger`}`)) {
      hide()
    }
  }

  const handleHtmlRendering = (classNames = '', inlineStyle = {}, tipPos = {}) => {
    const body = document.getElementsByTagName('body')[0]
    const toolTip = document.getElementById(id.current) as HTMLElement
    const div = document.createElement('div')

    div.setAttribute('id', id.current)

    if (toolTip) {
      body.replaceChild(div, toolTip)
    } else {
      body.appendChild(div)
    }

    ReactDOM.render(
      <div ref={tooltipRef} className={cx(style.tooltip, classNames)} style={inlineStyle}>
        <div ref={tipRef} className="tooltipArrow" style={tipPos}></div>
        <div className="tooltipInner">{content}</div>
      </div>,
      div
    )
  }

  const hide = () => {
    document.removeEventListener('mousemove', mouseMove)
    tooltipRef.current.classList.remove(style.visible)
    const body = document.getElementsByTagName('body')[0]

    clearTimeout(timeout.current)
    timeout.current = setTimeout(() => {
      const div = document.getElementById(id.current) as HTMLElement
      if (div) {
        body.removeChild(div)
      }
    }, 300)
  }

  return cloneElement(Children.only(children), {
    id: childId || `${id.current}-trigger`,
    onMouseEnter: show,
    onMouseLeave: hide
  })
}

export default ToolTip
