import classnames from 'classnames'
import _ from 'lodash'
import React from 'react'
import { AbstractNodeFactory } from 'storm-react-diagrams'

import ConditionItem from '../../common/condition'
import { BaseNodeModel } from '../nodes/BaseNodeModel'
import { StandardPortWidget } from '../nodes/Ports'

import style from './style.scss'
import { showHeaderV2 } from './utils'

class SubWorkflowNodeWidget extends React.Component<{ node: SubWorkflowNodeModel }> {
  render() {
    const node = this.props.node

    return (
      <div className={classnames(style.baseNode, style.nodeRouter, { [style.highlightedNode]: node.isHighlighted })}>
        {showHeaderV2({ nodeType: 'Sub Workflow', nodeName: node.name, isStartNode: node.isStartNode })}
        <div className={style.content}>
          {node.next?.map((item, i) => {
            const outputPortName = `out${i}`
            return (
              <div key={`${i}.${item}`} style={{ display: 'flex', justifyContent: 'space-between', padding: 1 }}>
                <ConditionItem condition={item} position={i} />
                <StandardPortWidget name={outputPortName} node={node} />
              </div>
            )
          })}
        </div>
        <div className={style.ports}>
          <StandardPortWidget name="in" node={node} className={style.in} />
        </div>
      </div>
    )
  }
}

export class SubWorkflowNodeModel extends BaseNodeModel {
  constructor({ id, x, y, name, onEnter = [], next = [], isStartNode = false, isHighlighted = false }) {
    super('sub-workflow', id)
    this.setData({ name, onEnter, next, isStartNode, isHighlighted })

    this.x = this.oldX = x
    this.y = this.oldY = y
  }
}

export class SubWorkflowWidgetFactory extends AbstractNodeFactory {
  constructor() {
    super('sub-workflow')
  }

  generateReactWidget(diagramEngine, node) {
    return <SubWorkflowNodeWidget node={node} />
  }

  getNewInstance() {
    // @ts-ignore
    return new SubWorkflowNodeModel()
  }
}
