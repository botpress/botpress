import classnames from 'classnames'
import _ from 'lodash'
import React, { Component } from 'react'
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams'

import { BaseNodeModel } from '../nodes/BaseNodeModel'
import { StandardPortWidget } from '../nodes/Ports'

import style from './style.scss'
import { showHeader } from './utils'

export class FailureWidget extends Component<{ node: FailureNodeModel; diagramEngine: any }> {
  render() {
    const node = this.props.node

    return (
      <div className={classnames(style.baseNode, style.nodeFailure, { [style.highlightedNode]: node.isHighlighted })}>
        {showHeader({ nodeType: 'Failure', nodeName: node.name, isStartNode: false })}
        <div className={style.ports}>
          <StandardPortWidget name="in" node={node} className={style.in} />
        </div>
      </div>
    )
  }
}

export class FailureNodeModel extends BaseNodeModel {
  constructor({ id, x, y, name, onEnter = [], next = [], isStartNode = false, isHighlighted = false }) {
    super('failure', id)
    this.setData({ name, onEnter, next, isStartNode, isHighlighted })

    this.x = this.oldX = x
    this.y = this.oldY = y
  }
}

export class FailureWidgetFactory extends AbstractNodeFactory {
  constructor() {
    super('failure')
  }

  generateReactWidget(diagramEngine: DiagramEngine, node: FailureNodeModel) {
    return <FailureWidget node={node} diagramEngine={diagramEngine} />
  }

  getNewInstance() {
    // @ts-ignore
    return new FailureNodeModel()
  }
}
