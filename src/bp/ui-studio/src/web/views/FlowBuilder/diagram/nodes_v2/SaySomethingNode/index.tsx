import classnames from 'classnames'
import _ from 'lodash'
import React, { Component } from 'react'
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams'

import { BaseNodeModel } from '../../nodes/BaseNodeModel'
import { StandardPortWidget } from '../../nodes/Ports'
import style from '../style.scss'
import { showHeader } from '../utils'

import SayNodeContent from './SayNodeContent'

export class SaySomethingWidget extends Component<{
  node: SaySomethingNodeModel
  diagramEngine: any
  contentLang?: string
  defaultLanguage?: string
}> {
  render() {
    const { node } = this.props

    return (
      <div
        onClick={() => this.props.diagramEngine.flowBuilder.props.switchFlowNode(this.props.node.id)}
        className={classnames(style.baseNode, style.nodeSaySomething, { [style.highlightedNode]: node.isHighlighted })}
      >
        {showHeader({ nodeType: 'Say', nodeName: node.name, isStartNode: node.isStartNode })}
        <div className={style.content}>
          <SayNodeContent node={node} data={node.formData} contentType={node.contentType} />
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
  public contentType
  public formData = {}

  constructor({
    id,
    x,
    y,
    name,
    onEnter = [],
    next = [],
    contentType,
    formData = {},
    isStartNode = false,
    isHighlighted = false
  }) {
    super('say_something', id)
    this.setData({ name, onEnter, next, contentType, formData, isStartNode, isHighlighted })

    this.x = this.oldX = x
    this.y = this.oldY = y
  }

  setData({ contentType, formData, ...data }: any) {
    this.contentType = contentType
    this.formData = formData

    super.setData(data as any)
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
