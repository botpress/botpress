import React, { FC, useReducer } from 'react'

export const stateReducer = (state, action) => {
  if (action.type === 'show') {
    return { ...state, visible: true }
  } else if (action.type === 'hide') {
    return { ...state, visible: false }
  } else {
    throw new Error(`That action type isn't supported.`)
  }
}

const ToolTip: FC<any> = props => {
  const [state, dispatch] = useReducer(stateReducer, { visible: false, x: 0, y: 0, type: 'none' })

  const visibility = state.visible == true ? 'on' : 'off'

  const style = {
    left: state.x + window.scrollX + 'px',
    top: state.y + window.scrollY + 'px'
  }

  const classNames = {}

  if (state.type != null && state.type != 'none') {
    classNames[state.type] = true
  }

  classNames[visibility] = true

  return (
    <div id="tooltip" className={Object.keys(classNames).join(' ')} style={style}>
      <div className="tooltip-arrow"></div>
      <div className="tooltip-inner">ToolTip Component</div>
    </div>
  )

  /*const pastShow = (hoverRect) => {
    // position the tooltip after showing it

    const ttNode = ReactDOM.findDOMNode(this)

    if (ttNode != null) {
      let x = 0,
        y = 0

      const docWidth = document.documentElement.clientWidth,
        docHeight = document.documentElement.clientHeight

      const rx = hoverRect.x + hoverRect.width, // most right x
        lx = hoverRect.x, // most left x
        ty = hoverRect.y, // most top y
        by = hoverRect.y + hoverRect.height // most bottom y

      // tool tip rectange
      const ttRect = ttNode.getBoundingClientRect()

      const bRight = rx + ttRect.width <= window.scrollX + docWidth
      const bLeft = lx - ttRect.width >= 0

      const bAbove = ty - ttRect.height >= 0
      const bBellow = by + ttRect.height <= window.scrollY + docHeight

      let newState = {}

      // the tooltip doesn't fit to the right
      if (bRight) {
        x = rx

        y = ty + (hoverRect.height - ttRect.height)

        if (y < 0) {
          y = ty
        }

        newState.type = 'right'
      } else if (bBellow) {
        y = by

        x = lx + (hoverRect.width - ttRect.width)

        if (x < 0) {
          x = lx
        }

        newState.type = 'bottom'
      } else if (bLeft) {
        x = lx - ttRect.width

        y = ty + (hoverRect.height - ttRect.height)

        if (y < 0) {
          y = ty
        }

        newState.type = 'left'
      } else if (bAbove) {
        y = ty - ttRect.height

        x = lx + (hoverRect.width - ttRect.width)

        if (x < 0) {
          x = lx
        }

        newState.type = 'top'
      }

      newState = { ...newState, x: x, y: y }

      this.setState(newState)
    }
  }
  const show = (hoverRect) => {
    const { pastShow } = this

    // setState will execute the pastShow with hoverRect as the tool tip becomes visible
    this.setState({ visible: true }, pastShow.bind(this, hoverRect))
  }
  const hide = () => {
    this.setState({ visible: false })
  }*/
}

export default ToolTip
