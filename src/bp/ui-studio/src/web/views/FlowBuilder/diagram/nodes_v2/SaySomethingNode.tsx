import classnames from 'classnames'
import _ from 'lodash'
import React, { Component } from 'react'
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams'
import ContentPickerWidget from '~/components/Content/Select/Widget'

import { BaseNodeModel } from '../nodes/BaseNodeModel'
import { StandardPortWidget } from '../nodes/Ports'

import style from './style.scss'
import { showHeader, textToItemId } from './utils'

export class SaySomethingWidget extends Component<{ node: SaySomethingNodeModel; diagramEngine: any }> {
  handleItemChanged = currentItem => {
    const flowBuilder = this.props.diagramEngine.flowBuilder.props
    flowBuilder.switchFlowNode(this.props.node.id)
    flowBuilder.updateFlowNode({ onEnter: [`say #!${currentItem.id}`] })
  }

  render() {
    const node = this.props.node
    const itemId = textToItemId((node.onEnter && node.onEnter.length && node.onEnter[0]) || '')

    return (
      <div
        className={classnames(style.baseNode, style.nodeSaySomething, { [style.highlightedNode]: node.isHighlighted })}
      >
        {showHeader({ nodeType: 'Say', nodeName: node.name, isStartNode: node.isStartNode })}
        <div className={style.content}>
          <ContentPickerWidget itemId={itemId} onChange={this.handleItemChanged} layoutv2={true} />
        </div>
        <div className={style.ports}>
          <StandardPortWidget name="in" node={node} className={style.in} />
          <StandardPortWidget name="out0" node={node} className={style.out} />
        </div>
      </div>
    )
  }
}

export class SaySomethingNodeModel extends BaseNodeModel {
  constructor({ id, x, y, name, onEnter = [], next = [], isStartNode = false, isHighlighted = false }) {
    super('say_something', id)
    this.setData({ name, onEnter, next, isStartNode, isHighlighted })

    this.x = this.oldX = x
    this.y = this.oldY = y
  }
}

export class SaySomethingWidgetFactory extends AbstractNodeFactory {
  constructor() {
    super('say_something')
  }

  generateReactWidget(diagramEngine: DiagramEngine, node: SaySomethingNodeModel) {
    return <SaySomethingWidget node={node} diagramEngine={diagramEngine} />
  }

  getNewInstance() {
    // @ts-ignore
    return new SaySomethingNodeModel()
  }
}
