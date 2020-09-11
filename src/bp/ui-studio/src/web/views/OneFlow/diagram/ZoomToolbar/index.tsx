import { Button, Icon, Tooltip } from '@blueprintjs/core'
import { Icons, lang, ToolTip, utils } from 'botpress/shared'
import React, { FC, Fragment, useState } from 'react'
import { HotKeys } from 'react-hotkeys'

import style from './style.scss'

interface Props {
  zoomLevel: number
  setZoomLevel: (zoom: number) => void
}

const ZoomToolbar: FC<Props> = ({ zoomLevel, setZoomLevel }) => {
  const zoomIn = () => {
    console.log('test')
    setZoomLevel(zoomLevel + 25)
  }

  const zoomOut = () => {
    console.log('test out')
    setZoomLevel(zoomLevel - 25)
  }

  return (
    <div className={style.zoomWrapper}>
      <ToolTip content={lang.tr('studio.zoomOut')}>
        <Button icon="zoom-out" disabled={zoomLevel <= 25} onClick={zoomOut} />
      </ToolTip>
      <label>
        <span className={style.label}>{zoomLevel}%</span>
        <select value={zoomLevel} onChange={({ currentTarget: { value } }) => setZoomLevel(Number.parseInt(value))}>
          <option value={25}>25%</option>
          <option value={50}>50%</option>
          <option value={75}>75%</option>
          <option value={100}>100%</option>
          <option value={150}>150%</option>
          <option value={200}>200%</option>
        </select>
      </label>
      <ToolTip content={lang.tr('studio.zoomIn')}>
        <Button icon="zoom-in" disabled={zoomLevel >= 200} onClick={zoomIn} />
      </ToolTip>
    </div>
  )
}

export default ZoomToolbar
