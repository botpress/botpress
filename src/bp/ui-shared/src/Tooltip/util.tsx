import cx from 'classnames'
import React, { FC } from 'react'
import ReactDOM from 'react-dom'

import style from './style.scss'

export function getUpdatedPosition(el, parentEl) {
  let x = 0
  let y = 0

  const docWidth = document.documentElement.clientWidth
  const docHeight = document.documentElement.clientHeight
  const hoverRect = parentEl.getBoundingClientRect()
  const tooltip = el.getBoundingClientRect()

  const parentRight = hoverRect.x + hoverRect.width
  const parentLeft = hoverRect.x
  const parentTop = hoverRect.y
  const parentBottom = hoverRect.y + hoverRect.height

  const fitsRight = parentRight + tooltip.width <= window.scrollX + docWidth
  const fitsLeft = parentLeft - tooltip.width >= 0
  const fitsTop = parentTop - tooltip.height >= 0
  const fitsBellow = parentBottom + tooltip.height <= window.scrollY + docHeight
  const tipSize = 5

  let newType = ''

  if (fitsTop) {
    y = parentTop - tooltip.height - tipSize

    x = parentLeft + (hoverRect.width / 2 - tooltip.width / 2)

    if (x < 0) {
      x = parentLeft
    }

    newType = 'top'
  } else if (fitsRight) {
    x = parentRight + tipSize

    y = parentTop - (tooltip.height - hoverRect.height) / 2

    if (y < 0) {
      y = parentTop
    }

    newType = 'right'
  } else if (fitsLeft) {
    x = parentLeft - tooltip.width - tipSize

    y = parentTop - (tooltip.height - hoverRect.height) / 2

    if (y < 0) {
      y = parentTop
    }

    newType = 'left'
  } else if (fitsBellow) {
    y = parentBottom + tipSize

    x = parentLeft + (hoverRect.width / 2 - tooltip.width / 2)

    if (x < 0) {
      x = parentLeft
    }

    newType = 'bottom'
  }

  return {
    type: newType,
    position: { x, y }
  }
}

const TooltipElement: FC<any> = props => {
  const { position, type, elementRef, content } = props
  const inlineStyle = {
    left: position.x + window.scrollX + 'px',
    top: position.y + window.scrollY + 'px'
  }

  return (
    <div
      id="tooltip"
      ref={elementRef}
      className={cx(style.tooltip, { [style[type]]: type && type !== 'none' })}
      style={inlineStyle}
    >
      <div className={style.tooltipInner}>{content}</div>
    </div>
  )
}

export function addTooltip(props) {
  const body = document.getElementsByTagName('body')[0]
  const div = document.createElement('div')

  div.setAttribute('id', 'botpress-tooltip-wrapper')
  body.appendChild(div)

  ReactDOM.render(<TooltipElement {...props} />, div)
}

export function updateTooltip(props) {
  const tooltipWrapper = document.getElementById('botpress-tooltip-wrapper')

  ReactDOM.render(<TooltipElement {...props} />, tooltipWrapper)
}

export function removeTooltip() {
  const div = document.getElementById('botpress-tooltip-wrapper') as HTMLElement

  if (div) {
    document.getElementsByTagName('body')[0].removeChild(div)
  }
}
