// @ts-nocheck
import cx from 'classnames'
import React, { FC, useState } from 'react'

import style from './style.scss'
import { TabsProps } from './typings'

const Tabs: FC<TabsProps> = ({ className, currentTab, shouldFloat, tabChange, tabs }) => {
  const [selectedTab, setSelectedTab] = useState(currentTab || tabs[0].id)

  const handleClick = tabId => {
    setSelectedTab(tabId)
    tabChange(tabId)
  }

  return (
    <ul className={cx(style.tabs, className, { [style.float]: shouldFloat })}>
      {tabs.map(tab => (
        <li key={tab.id} id={`tab-${tab.id}`}>
          <button
            disabled={tab.disabled}
            className={cx(tab.className, { [style.active]: selectedTab === tab.id })}
            onClick={() => handleClick(tab.id)}
          >
            {tab.title}
          </button>
        </li>
      ))}
    </ul>
  )
}

export default Tabs
