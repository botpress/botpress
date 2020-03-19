import classnames from 'classnames'
import _ from 'lodash'
import React, { Component } from 'react'
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams'

import { BaseNodeModel } from '../nodes/BaseNodeModel'
import { StandardPortWidget } from '../nodes/Ports'

import style from './style.scss'
import { showHeader } from './utils'

export class SuccessWidget extends Component<{ node: SuccessNodeModel; diagramEngine: any }> {
  render() {
    const node = this.props.node

    return (
      <div className={classnames(style.baseNode, style.nodeSuccess, { [style.highlightedNode]: node.isHighlighted })}>
        {showHeader({ nodeType: 'Success', nodeName: node.name, isStartNode: false })}
        <div className={style.ports}>
          <StandardPortWidget name="in" node={node} className={style.in} />
        </div>
      </div>
    )
  }
}

export class SuccessNodeModel extends BaseNodeModel {
  constructor({ id, x, y, name, onEnter = [], next = [], isStartNode = false, isHighlighted = false }) {
    super('success', id)
    this.setData({ name, onEnter, next, isStartNode, isHighlighted })

    this.x = this.oldX = x
    this.y = this.oldY = y
  }
}

export class SuccessWidgetFactory extends AbstractNodeFactory {
  constructor() {
    super('success')
  }

  generateReactWidget(diagramEngine: DiagramEngine, node: SuccessNodeModel) {
    return <SuccessWidget node={node} diagramEngine={diagramEngine} />
  }

  getNewInstance() {
    // @ts-ignore
    return new SuccessNodeModel()
  }
}
