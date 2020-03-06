import classnames from 'classnames'
import React, { Component, Fragment } from 'react'
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams'

import ConditionItem from '../../../OneFlow/diagram/TriggerEditor/Condition/Item'
import { BaseNodeModel } from '../nodes/BaseNodeModel'
import { StandardPortWidget } from '../nodes/Ports'

import style from './style.scss'
import { showHeaderV2 } from './utils'

export class TriggerWidget extends Component<{ node: TriggerNodeModel; diagramEngine: any }> {
  render() {
    const node = this.props.node
    const { conditions } = node

    return (
      <div className={classnames(style.baseNode, style.nodeTrigger, { [style.highlightedNode]: node.isHighlighted })}>
        {showHeaderV2({ nodeType: 'NLU Trigger', nodeName: node.name, isStartNode: node.isStartNode })}
        <div className={style.content}>
          <ul className={style.nodeTriggerConditions}>
            {!conditions?.length && <li>Add conditions to get started</li>}
            {!!conditions?.length && (
              <Fragment>
                {conditions.slice(0, 2).map(condition => (
                  <ConditionItem diagramNodeView condition={condition} key={condition.id} />
                ))}
                {conditions.length > 2 && <li>+ {conditions.length - 2} conditions</li>}
              </Fragment>
            )}
          </ul>
        </div>
        <div className={style.ports}>
          <StandardPortWidget name="out0" node={node} className={style.out} />
        </div>
      </div>
    )
  }
}

export class TriggerNodeModel extends BaseNodeModel {
  public conditions = []

  constructor({
    id,
    x,
    y,
    name,
    onEnter = [],
    next = [],
    conditions = [],
    isStartNode = false,
    isHighlighted = false
  }) {
    super('trigger', id)
    this.setData({ name, onEnter, next, isStartNode, isHighlighted, conditions })

    this.x = this.oldX = x
    this.y = this.oldY = y
  }

  setData({ conditions = [], ...data }) {
    this.conditions = conditions

    super.setData(data as any)
  }
}

export class TriggerWidgetFactory extends AbstractNodeFactory {
  constructor() {
    super('trigger')
  }

  generateReactWidget(diagramEngine: DiagramEngine, node: TriggerNodeModel) {
    return <TriggerWidget node={node} diagramEngine={diagramEngine} />
  }

  getNewInstance() {
    // @ts-ignore
    return new TriggerNodeModel()
  }
}
