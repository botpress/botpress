import classnames from 'classnames'
import _ from 'lodash'
import React, { Component } from 'react'
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams'

import RoutingItem from '../../common/routing'
import { BaseNodeModel } from '../nodes/BaseNodeModel'
import { StandardPortWidget } from '../nodes/Ports'

import style from './style.scss'
import { showHeader } from './utils'

export class RouterWidget extends Component<{ node: RouterNodeModel; diagramEngine: any }> {
  render() {
    const node = this.props.node

    return (
      <div className={classnames(style.baseNode, style.nodeRouter, { [style.highlightedNode]: node.isHighlighted })}>
        {showHeader({ nodeType: 'Router', nodeName: node.name, isStartNode: node.isStartNode })}
        <div className={classnames(style.content, style.ports)}>
          {node.next &&
            node.next.map((item, i) => {
              const outputPortName = `out${i}`
              return (
                <div key={`${i}.${item}`} style={{ display: 'flex', justifyContent: 'space-between', padding: 1 }}>
                  <RoutingItem condition={item} position={i} />
                  <StandardPortWidget name={outputPortName} node={node} className={style.outRouting} />
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

export class RouterNodeModel extends BaseNodeModel {
  constructor({ id, x, y, name, onEnter = [], next = [], isStartNode = false, isHighlighted = false }) {
    super('router', id)
    this.setData({ name, onEnter, next, isStartNode, isHighlighted })

    this.x = this.oldX = x
    this.y = this.oldY = y
  }
}

export class RouterWidgetFactory extends AbstractNodeFactory {
  constructor() {
    super('router')
  }

  generateReactWidget(diagramEngine: DiagramEngine, node: RouterNodeModel) {
    return <RouterWidget node={node} diagramEngine={diagramEngine} />
  }

  getNewInstance() {
    // @ts-ignore
    return new RouterNodeModel()
  }
}
