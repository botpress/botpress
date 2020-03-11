import cx from 'classnames'
import React, { FC, Fragment, useRef, useState } from 'react'

import style from './style.scss'
import { TooltipProps } from './typings'

const Tooltip: FC<TooltipProps> = props => {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [type, setType] = useState('nonde')
  const elementRef = useRef<HTMLDivElement>(null)

  const visibility = visible == true ? style.on : style.off
  const inlineStyle = {
    left: position.x + window.scrollX + 'px',
    top: position.y + window.scrollY + 'px'
  }

  console.log(inlineStyle)

  const classNames = {}

  if (type != null && type != 'none') {
    classNames[type] = true
  }

  classNames[visibility] = true

  const pastShow = hoverRect => {
    // position the tooltip after showing it
    if (elementRef.current != null) {
      let x = 0,
        y = 0

      const docWidth = document.documentElement.clientWidth,
        docHeight = document.documentElement.clientHeight

      const rx = hoverRect.x + hoverRect.width, // most right x
        lx = hoverRect.x, // most left x
        ty = hoverRect.y, // most top y
        by = hoverRect.y + hoverRect.height // most bottom y

      // tool tip rectange
      const ttRect = elementRef.current?.getBoundingClientRect()

      const bRight = rx + ttRect.width <= window.scrollX + docWidth
      const bLeft = lx - ttRect.width >= 0

      const bAbove = ty - ttRect.height >= 0
      const bBellow = by + ttRect.height <= window.scrollY + docHeight

      let newType = ''

      // the tooltip doesn't fit to the right
      if (bRight) {
        x = rx

        y = ty + (hoverRect.height - ttRect.height)

        if (y < 0) {
          y = ty
        }

        newType = 'right'
      } else if (bBellow) {
        y = by

        x = lx + (hoverRect.width - ttRect.width)

        if (x < 0) {
          x = lx
        }

        newType = 'bottom'
      } else if (bLeft) {
        x = lx - ttRect.width

        y = ty + (hoverRect.height - ttRect.height)

        if (y < 0) {
          y = ty
        }

        newType = 'left'
      } else if (bAbove) {
        y = ty - ttRect.height

        x = lx + (hoverRect.width - ttRect.width)

        if (x < 0) {
          x = lx
        }

        newType = 'top'
      }

      setType(newType)
      setPosition({ x, y })
    }
  }

  const show = hoverRect => {
    // setState will execute the pastShow with hoverRect as the tool tip becomes visible
    // this.setState({ visible: true }, pastShow.bind(this, hoverRect))

    pastShow(hoverRect)
    setVisible(true)
  }

  const handleOnMouseLeave = evt => {
    setVisible(false)
  }

  const handleOnMouseOver = evt => {
    // get hovered element reference
    const el = evt.currentTarget

    if (el != null) {
      const rect = el.getBoundingClientRect()

      show(rect)
    }
  }

  return (
    <div>
      <div onMouseOver={handleOnMouseOver} onMouseLeave={handleOnMouseLeave}>
        {props.children}
      </div>
      <div
        id="tooltip"
        ref={elementRef}
        className={cx(style.tooltip, Object.keys(classNames).join(' '))}
        style={inlineStyle}
      >
        <div className={style.tooltipArrow}></div>
        <div className={style.tooltipInner}>Tooltip Component</div>
      </div>
    </div>
  )
}

export default Tooltip
