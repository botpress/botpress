import classnames from 'classnames'
import _ from 'lodash'
import React, { Component } from 'react'
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams'
import { StandardPortWidget } from '~/views/FlowBuilder/diagram/nodes/Ports'
import style from '~/views/FlowBuilder/diagram/nodes_v2/style.scss'
import { showHeader } from '~/views/FlowBuilder/diagram/nodes_v2/utils'

import { BaseNodeModel } from '../../../../FlowBuilder/diagram/nodes/BaseNodeModel'

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
          <SayNodeContent node={node} data={node.content?.formData} contentType={node.content?.contentType} />
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
  public content = { contentType: null, formData: {} }

  constructor({ id, x, y, name, onEnter = [], next = [], content, isStartNode = false, isHighlighted = false }) {
    super('say_something', id)
    this.setData({ name, onEnter, next, content, isStartNode, isHighlighted })

    this.x = this.oldX = x
    this.y = this.oldY = y
  }

  setData({ content, ...data }: any) {
    this.content = content

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
