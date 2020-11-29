import { Button, ButtonGroup, Divider, Intent, Tab, Tabs, Tooltip } from '@blueprintjs/core'
import { lang, ToolTip } from 'botpress/shared'
import cx from 'classnames'
import React, { useEffect, useState } from 'react'
import JSONTree from 'react-json-tree'

import style from '../style.scss'
import inspectorTheme from '../Debugger/inspectorTheme'

const InspectorTab = props => {
  const [expand, setExpand] = useState(false)
  const [current, setCurrent] = useState({})

  useEffect(() => {
    setCurrent(props.history[0]?.data)
  }, [props.history])

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
                  <div className={style.item} onClick={() => setCurrent(x.data)}>
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
