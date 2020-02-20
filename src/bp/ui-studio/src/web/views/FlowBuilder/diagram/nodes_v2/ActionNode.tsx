import { Button } from '@blueprintjs/core'
import classnames from 'classnames'
import { ActionServer, ActionServersWithActions } from 'common/typings'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams'

import ActionDialog from '../../nodeProps/ActionDialog'
import { BaseNodeModel } from '../nodes/BaseNodeModel'
import { StandardPortWidget } from '../nodes/Ports'

import style from './style.scss'
import { showHeader } from './utils'

interface ActionWidgetProps {
  node: ActionNodeModel
  actionServers: ActionServersWithActions[]
  diagramEngine: any
}

const ActionWidget: FC<ActionWidgetProps> = props => {
  const { node, diagramEngine, actionServers } = props

  const parseActionString = (actionString: string | undefined): Action => {
    const defaultActionServer = actionServers[0]
    const defaultAction = defaultActionServer.actions[0]

    const defaultName = defaultAction?.name
    const defaultParameters = {}
    const defaultActionServerId = defaultActionServer.id

    let name = defaultName
    let parameters = defaultParameters
    let actionServerId = defaultActionServerId

    if (actionString) {
      const chunks = actionString.split(' ')
      name = chunks[0] || defaultName

      const parametersString = chunks[1]
      parameters = parametersString ? JSON.parse(parametersString) : defaultParameters

      actionServerId = chunks[2] || defaultActionServerId
    }

    return { name, parameters, actionServerId }
  }

  const [showDialog, setShowDialog] = useState(false)
  const [action, setAction] = useState(parseActionString(node.onEnter[0]))

  const isNewNode = node.onEnter.length === 0
  const actionIsValid = !!action.name && !!action.actionServerId

  useEffect(() => {
    if (isNewNode && actionIsValid) {
      saveNode()
    }
  }, [])

  const actionCopy = _.cloneDeep(parseActionString(node.onEnter[0]))

  const onSave = () => {
    setShowDialog(false)
    saveNode()
  }

  const saveNode = () => {
    const flowBuilder = diagramEngine.flowBuilder.props
    flowBuilder.switchFlowNode(node.id)
    flowBuilder.updateFlowNode({ onEnter: [serializeAction(action)] })
  }

  const cancel = () => {
    setAction(actionCopy)
  }

  return (
    <div className={classnames(style.baseNode, style.nodeAction, { [style.highlightedNode]: node.isHighlighted })}>
      {showHeader({ nodeType: 'Action', nodeName: node.name, isStartNode: node.isStartNode })}
      <Button onClick={() => setShowDialog(true)}>Edit</Button>
      <ActionDialog
        action={action}
        actionIsValid={actionIsValid}
        isOpen={showDialog}
        onClose={() => {
          setShowDialog(false)
          cancel()
        }}
        onUpdate={action => {
          setAction(action)
        }}
        onSave={onSave}
      />
      <div className={style.ports}>
        <StandardPortWidget name="in" node={node} className={style.in} />
        <StandardPortWidget name="out0" node={node} className={style.out} />
      </div>
    </div>
  )
}

const mapStateToProps = state => ({
  actionServers: state.actionServers
})

const mapDispatchToProps = {}

const ConnectedActionWidget = connect(mapStateToProps, mapDispatchToProps)(ActionWidget)

type PropType<TObj, TProp extends keyof TObj> = TObj[TProp]

export interface Parameters {
  [name: string]: string
}

export interface Action {
  name: string
  parameters: Parameters
  actionServerId: PropType<ActionServer, 'id'>
}

const serializeAction = (action: Action): string => {
  return [action.name, JSON.stringify(action.parameters), action.actionServerId].join(' ')
}

export class ActionNodeModel extends BaseNodeModel {
  constructor({ id, x, y, name, onEnter = [], next = [], isStartNode = false, isHighlighted = false }) {
    super('action', id)
    this.setData({ name, onEnter, next, isStartNode, isHighlighted })

    this.x = this.oldX = x
    this.y = this.oldY = y
  }
}

export class ActionWidgetFactory extends AbstractNodeFactory {
  constructor() {
    super('action')
  }

  generateReactWidget(diagramEngine: DiagramEngine, node: ActionNodeModel) {
    return <ConnectedActionWidget node={node} diagramEngine={diagramEngine} />
  }

  getNewInstance() {
    // @ts-ignore
    return new ActionNodeModel()
  }
}
