import classnames from 'classnames'
import _ from 'lodash'
import React, { Component } from 'react'
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams'

import ActionItem from '../../common/action'
import ConditionItem from '../../common/condition'

import { BaseNodeModel } from './BaseNodeModel'
import { StandardPortWidget } from './Ports'

const style = require('./style.scss')

export class StandardNodeWidget extends Component<{ node: StandardNodeModel; diagramEngine: DiagramEngine }> {
  render() {
    const node = this.props.node
    const isWaiting = node.waitOnReceive

    const className = classnames(style['node-container'], { [style.highlightedNode]: node.isHighlighted })

    return (
      <div className={className}>
        <div className={style.topPort}>
          <StandardPortWidget name="in" node={node} />
        </div>
        <div className={style.header} />
        <div className={style.content}>
          <div className={classnames(style['section-onEnter'], style.section)}>
            {node.onEnter &&
              node.onEnter.map((item, i) => {
                return <ActionItem key={`${i}.${item}`} className={style.item} text={item} />
              })}
          </div>
          <div className={classnames(style['section-title'], style.section, { [style.waiting]: isWaiting })}>
            {node.name}
          </div>
          <div className={classnames(style['section-onReceive'], style.section)}>
            {node.onReceive &&
              node.onReceive.map((item, i) => {
                return <ActionItem key={`${i}.${item}`} className={style.item} text={item} />
              })}
          </div>
          <div className={classnames(style['section-next'], style.section)}>
            {node.next &&
              node.next.map((item, i) => {
                const outputPortName = `out${i}`
                return (
                  <div key={`${i}.${item}`} className={classnames(style.item)}>
                    <ConditionItem condition={item} position={i} />
                    <StandardPortWidget name={outputPortName} node={node} next={node.next} />
                  </div>
                )
              })}
          </div>
        </div>
        <div className={style.footer}>
          <div />
        </div>
      </div>
    )
  }
}

export class StandardNodeModel extends BaseNodeModel {
  constructor({ id, x, y, name, onEnter = [], onReceive = [], next = [], isStartNode = false, isHighlighted = false }) {
    super('standard', id)

    this.setData({ name, onEnter, onReceive, next, isStartNode, isHighlighted })

    this.x = this.oldX = x
    this.y = this.oldY = y
  }
}

export const StandardNodeWidgetFactory = React.createFactory(StandardNodeWidget)

export class StandardWidgetFactory extends AbstractNodeFactory {
  constructor() {
    super('standard')
  }

  generateReactWidget(diagramEngine: DiagramEngine, node: StandardNodeModel) {
    return <StandardNodeWidget node={node} diagramEngine={diagramEngine} />
  }

  getNewInstance() {
    // @ts-ignore
    return new StandardNodeModel()
  }
}
