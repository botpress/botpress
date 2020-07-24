// @ts-nocheck
import cx from 'classnames'
import React, { Children, cloneElement, FC, useEffect, useRef } from 'react'
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
      left = elLeft + elWidth + tooltipWidth
    }
  }

  let top = elTop + elHeight / 2 - tooltipWidth / 2

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
    right = elWidth / 2 - 5 + 'px'
  } else if (xClass === 'right' && (yClass === 'top' || yClass === 'bottom')) {
    left = elWidth / 2 - 5 + 'px'
  } else if (!xClass) {
    left = '50%'
  }

  return { left, right }
}

const ToolTip: FC<ToolTipProps> = ({ children, content, position = 'top' }) => {
  const elRef = useRef<any>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    elRef.current.addEventListener('mouseenter', show)
    elRef.current.addEventListener('mouseleave', hide)

    return () => {
      elRef.current.removeEventListener('mouseenter', show)
      elRef.current.removeEventListener('mouseleave', hide)
    }
  }, [elRef.current])

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

      const { left, top } = getPositions({ xClass, yClass }, elRef.current, tooltipRef.current)
      const tipPos = tipPosition({ xClass, yClass }, elRef.current)

      const inlineStyle = {
        left: left + 'px',
        top: top + 'px'
      }

      handleHtmlRendering(cx(style.visible, xClass, yClass), inlineStyle, tipPos)
    }
  }

  const show = () => {
    handleHtmlRendering()
    pastShow()
  }

  const handleHtmlRendering = (classNames = '', inlineStyle = {}, tipPos = {}) => {
    const body = document.getElementsByTagName('body')[0]
    const toolTip = document.getElementById('botpress-tooltip') as HTMLElement
    const div = document.createElement('div')

    div.setAttribute('id', 'botpress-tooltip')

    if (toolTip) {
      body.replaceChild(div, toolTip)
    } else {
      body.appendChild(div)
    }

    ReactDOM.render(
      <div ref={tooltipRef} className={cx(style.tooltip, classNames)} style={inlineStyle}>
        <div ref={tipRef} className='tooltipArrow' style={tipPos}></div>
        <div className='tooltipInner'>{content}</div>
      </div>,
      div
    )
  }

  const hide = () => {
    const div = document.getElementById('botpress-tooltip') as HTMLElement
    const body = document.getElementsByTagName('body')[0]

    body.removeChild(div)
  }

  return cloneElement(Children.only(children), { ref: el => (elRef.current = el) })
}

export default ToolTip
