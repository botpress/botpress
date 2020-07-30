import { Button, Tab, Tabs } from '@blueprintjs/core'
import { FlowNode } from 'botpress/sdk'
import { lang, MoreOptions, MoreOptionsItems, RightSidebar } from 'botpress/shared'
import React, { FC, Fragment, useState } from 'react'
import ActionDialog from '~/views/FlowBuilder/nodeProps/ActionDialog'

import { Action, ActionInfo, parseActionString } from '../nodes/ActionContents'
import { BlockModel } from '../nodes/Block'

import style from './style.scss'

interface Props {
  deleteNode: () => void
  close: () => void
  node: FlowNode
  diagramEngine: any
}

const serializeAction = (action: Action): string => {
  const firstPart = action.actionServerId ? `${action.actionServerId}:${action.name}` : action.name
  return [firstPart, JSON.stringify(action.parameters)].join(' ')
}

const ActionForm: FC<Props> = ({ close, node, diagramEngine, deleteNode }) => {
  const [showModal, setShowModal] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

  const moreOptionsItems: MoreOptionsItems[] = [
    {
      label: lang.tr('deleteNode'),
      action: deleteNode,
      type: 'delete'
    }
  ]

  const onSave = action => {
    const flowBuilder = diagramEngine.flowBuilder.props
    flowBuilder.switchFlowNode(node.id)
    flowBuilder.updateFlowNode({ onEnter: [serializeAction(action)] })
  }

  const action = parseActionString((node as BlockModel)?.onEnter?.[0])

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
          <Button onClick={() => setShowModal(true)}>
            <ActionInfo action={action} />
          </Button>
          <ActionDialog
            name={action.name}
            parameters={action.parameters}
            actionServerId={action.actionServerId}
            isOpen={showModal}
            onClose={() => {
              setShowModal(false)
            }}
            onSave={action => {
              setShowModal(false)
              onSave(action)
            }}
          />
        </div>
      </Fragment>
    </RightSidebar>
  )
}

export default ActionForm
