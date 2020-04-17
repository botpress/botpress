import cx from 'classnames'
import React, { FC, useState } from 'react'
import { HotKeys } from 'react-hotkeys'

import style from './style.scss'
import { MainContainerProps } from './typings'

const MainContainer: FC<MainContainerProps> = props => {
  const [showSidePanel, setShowSidePanel] = useState(true)
  const toggleSidePanel = () => {
    setShowSidePanel(!showSidePanel)
  }

  const keyHandlers = {
    ...(props.keyHandlers || {}),
    'toggle-sidepanel': toggleSidePanel
  }

  const children = React.Children.toArray(props.children)

  return (
    <HotKeys handlers={keyHandlers} keyMap={props.keyMap || {}} className={style.fullsize} focused>
      <div className={style.container}>
        {showSidePanel && <div className={style.leftSideBar}>{children[0]}</div>}
        <div className={cx(style.fullsize, style.mainContent, { [style.yOverflowScroll]: props.yOverflowScroll })}>
          {children.slice(1)}
        </div>
      </div>
    </HotKeys>
  )
}

export default MainContainer
