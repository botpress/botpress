import { Tab, Tabs } from '@blueprintjs/core'
import { FlowNode } from 'botpress/sdk'
import { Dropdown, lang, RightSidebar } from 'botpress/shared'
import React, { FC, Fragment, useState } from 'react'

import style from './style.scss'

interface Props {
  onUpdate: (data: any) => void
  deleteNode: () => void
  close: () => void
  node: FlowNode
  diagramEngine: any
}

const MapForm: FC<Props> = ({ close, node, diagramEngine, deleteNode, onUpdate }) => {
  const [choice, setChoice] = useState('1')

  return (
    <RightSidebar className={style.wrapper} close={() => close()}>
      <Fragment key={`${node?.id}`}>
        <div className={style.formHeader}>
          <Tabs id="contentFormTabs">
            <Tab id="content" title={lang.tr('studio.flow.nodeType.map')} />
          </Tabs>
        </div>
        <div className={style.formHeader}>
          <Dropdown
            filterable={false}
            items={[
              { value: '1', label: '1' },
              { value: '2', label: '2' },
              { value: '3', label: '3' },
              { value: '4', label: '4' }
            ]}
            defaultItem={choice}
            rightIcon="chevron-down"
            onChange={option => {
              setChoice(option.value)
              onUpdate(option.value)
            }}
          />
        </div>
      </Fragment>
    </RightSidebar>
  )
}

export default MapForm
