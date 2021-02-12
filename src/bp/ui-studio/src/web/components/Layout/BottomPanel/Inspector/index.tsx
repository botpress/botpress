import { Button, ButtonGroup, Intent, Tab, Tabs } from '@blueprintjs/core'
import { lang, ToolTip } from 'botpress/shared'
import cx from 'classnames'
import React, { FC, useEffect, useState } from 'react'
import JSONTree from 'react-json-tree'

import inspectorTheme from '../Debugger/inspectorTheme'
import style from '../style.scss'

export interface DataEntry {
  id: string
  data: any
}

interface Props {
  history: DataEntry[]
  commonButtons: JSX.Element
  hidden: boolean
}

const InspectorTab: FC<Props> = props => {
  const [expand, setExpand] = useState(false)
  const [current, setCurrent] = useState({})

  useEffect(() => {
    setCurrent(props.history[0]?.data)
  }, [props.history])

  if (props.hidden) {
    return null
  }

  return (
    <Tabs className={style.tabs}>
      <Tab
        id="inspector"
        title={lang.tr('inspector')}
        className={style.tab}
        panel={
          <div className={cx(style.tabContainer)}>
            <div className={style.inspectorMenu}>
              <div className={style.menu}>
                {props.history.map((x, idx) => (
                  <div key={x.id} className={style.item} onClick={() => setCurrent(x.data)}>
                    {idx + 1}. {x.id}
                  </div>
                ))}
              </div>
              <JSONTree
                data={current || {}}
                shouldExpandNode={() => expand}
                theme={inspectorTheme}
                invertTheme={true}
                hideRoot={true}
              />
            </div>
          </div>
        }
      />

      <Tabs.Expander />
      <ButtonGroup minimal={true}>
        <ToolTip content={lang.tr('bottomPanel.inspector.autoExpand')}>
          <Button
            id="btn-inspect-toggle"
            icon="layout-auto"
            intent={expand ? Intent.PRIMARY : Intent.NONE}
            small
            onClick={() => setExpand(!expand)}
          />
        </ToolTip>
        {props.commonButtons}
      </ButtonGroup>
    </Tabs>
  )
}

export default InspectorTab
