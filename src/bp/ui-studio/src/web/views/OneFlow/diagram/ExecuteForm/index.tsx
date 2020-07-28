import { Tab, Tabs } from '@blueprintjs/core'
import { FlowNode } from 'botpress/sdk'
import { lang, MoreOptions, MoreOptionsItems, RightSidebar } from 'botpress/shared'
import React, { FC, Fragment, useState } from 'react'
import ActionModalSmall from '~/views/FlowBuilder/nodeProps/ActionModalSmall'

import style from './style.scss'

interface Props {
  deleteNode: () => void
  close: () => void
  onUpdate: (data: any) => void
  node: FlowNode
  diagramEngine: any
}

const ExecuteForm: FC<Props> = ({ close, node, onUpdate, diagramEngine, deleteNode }) => {
  const [showOptions, setShowOptions] = useState(false)

  const moreOptionsItems: MoreOptionsItems[] = [
    {
      label: lang.tr('deleteNode'),
      action: deleteNode,
      type: 'delete'
    }
  ]

  const handleItemChanged = actionText => {
    const flowBuilder = diagramEngine.flowBuilder.props
    flowBuilder.switchFlowNode(node.id)
    flowBuilder.updateFlowNode({ onEnter: [actionText] })
  }

  const actionText = (node.onEnter && node.onEnter.length && node.onEnter[0]) || ''

  return (
    <RightSidebar key={`${node.id}`} className={style.wrapper} close={() => close()}>
      <div className={style.formHeader}>
        <Tabs id="contentFormTabs">
          <Tab id="content" title={lang.tr('studio.flow.nodeType.execute')} />
        </Tabs>
        <MoreOptions show={showOptions} onToggle={setShowOptions} items={moreOptionsItems} />
      </div>
      <div className={style.actionModal}>
        <ActionModalSmall text={actionText} onChange={handleItemChanged} layoutv2 />
      </div>
    </RightSidebar>
  )
}

export default ExecuteForm
