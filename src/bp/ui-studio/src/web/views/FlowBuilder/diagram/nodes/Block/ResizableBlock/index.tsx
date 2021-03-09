import cx from 'classnames'
import React, { SyntheticEvent, useState } from 'react'
import { ResizableBox, ResizeCallbackData } from 'react-resizable'
import { BlockModel } from '..'
import 'react-resizable/css/styles.css'

import style from './style.scss'

interface ResizableBlockProps {
  node: BlockModel
}

export const ResizableBlock: React.FunctionComponent<ResizableBlockProps> = props => {
  const [selected, setSelected] = useState(false)

  const { node } = props

  const onResizeStart = (_e: SyntheticEvent, _data: ResizeCallbackData) => {
    node.setLocked(true)

    setSelected(true)
  }

  const onResizeStop = (_e: SyntheticEvent, data: ResizeCallbackData) => {
    const { width, height } = data.size

    node.updateDimensions({ width: Math.round(width), height: Math.round(height) })
    node.setLocked(false)

    setSelected(false)
  }

  return (
    <ResizableBox
      className={cx({ [style.selected]: selected })}
      width={node.width}
      height={node.height}
      minConstraints={[100, 100]}
      onResizeStart={onResizeStart}
      onResizeStop={onResizeStop}
      draggableOpts={{ grid: [10, 10] }}
    >
      {props.children}
    </ResizableBox>
  )
}
