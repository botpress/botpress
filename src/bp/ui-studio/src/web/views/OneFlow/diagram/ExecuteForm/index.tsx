import { Tab, Tabs } from '@blueprintjs/core'
import { FlowNode } from 'botpress/sdk'
import { lang, MoreOptions, MoreOptionsItems, RightSidebar } from 'botpress/shared'
import React, { FC, Fragment, useState } from 'react'
import ActionModalSmall from '~/views/FlowBuilder/nodeProps/ActionModalSmall'

import style from './style.scss'

interface Props {
  deleteNode: () => void
  close: () => void
  node: FlowNode
  diagramEngine: any
}

const ExecuteForm: FC<Props> = ({ close, node, diagramEngine, deleteNode }) => {
  const [showModal, setShowModal] = useState(false)
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

  const actionText = (node?.onEnter?.length && node?.onEnter[0]) || ''

  return (
    <RightSidebar className={style.wrapper} canOutsideClickClose={!showModal} close={() => close()}>
      <Fragment key={`${node?.id}`}>
        <div className={style.formHeader}>
          <Tabs id="contentFormTabs">
            <Tab id="content" title={lang.tr('studio.flow.nodeType.execute')} />
          </Tabs>
          <MoreOptions show={showOptions} onToggle={setShowOptions} items={moreOptionsItems} />
        </div>
        <div className={style.actionModal}>
          <ActionModalSmall
            text={actionText}
            showingModal={showModal}
            showModal={() => setShowModal(true)}
            hideModal={() => setShowModal(false)}
            onChange={handleItemChanged}
            layoutv2
          />
        </div>
      </Fragment>
    </RightSidebar>
  )
}

export default ExecuteForm
