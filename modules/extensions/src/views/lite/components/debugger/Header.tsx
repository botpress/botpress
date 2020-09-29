import { Button } from '@blueprintjs/core'
import cx from 'classnames'
import React from 'react'

import sharedStyle from '../../../../../../../src/bp/ui-shared-lite/style.scss'
import Icons from '../../../../../../../src/bp/ui-shared-lite/Icons'
import Tabs from '../../../../../../../src/bp/ui-shared-lite/Tabs'
import ToolTip from '../../../../../../../src/bp/ui-shared-lite/ToolTip'
import lang from '../../../lang'

import style from './style.scss'

export default ({ hasProcessing, updateCurrentTab, selectedTab, maximized, setMaximized }) => {
  const tabs = [
    {
      id: 'content',
      title: lang.tr('module.extensions.header.debugger')
    }
  ]
  if (hasProcessing) {
    tabs.push({
      id: 'processing',
      title: lang.tr('module.extensions.header.processing')
    })
  }

  return (
    <div className={style.header}>
      <Tabs tabChange={updateCurrentTab} currentTab={selectedTab} tabs={tabs} />

      <ToolTip content={lang.tr(maximized ? 'minimizeInspector' : 'maximizeInspector')}>
        <Button
          className={cx(sharedStyle.expandBtn, style.noMargin)}
          small
          minimal
          icon={maximized ? <Icons.Minimize /> : 'fullscreen'}
          onClick={setMaximized}
        />
      </ToolTip>
    </div>
  )
}
