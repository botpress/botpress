import classnames from 'classnames'
import _ from 'lodash'
import React, { Component } from 'react'
import { AbstractNodeFactory, DiagramEngine } from 'storm-react-diagrams'

import { BaseNodeModel } from '../nodes/BaseNodeModel'
import { StandardPortWidget } from '../nodes/Ports'

import style from './style.scss'
import { showHeader } from './utils'

export class SendFeedbackWidget extends Component<{ node: SendFeedbackNodeModel; diagramEngine: any }> {
  render() {
    const node = this.props.node

    return (
      <div
        className={classnames(style.baseNode, style.nodeSendFeedback, { [style.highlightedNode]: node.isHighlighted })}
      >
        {showHeader({ nodeType: 'Send Feedback', nodeName: node.name, isStartNode: false })}
        <div className={style.ports}>
          <StandardPortWidget name="in" node={node} className={style.in} />
        </div>
      </div>
    )
  }
}

export class SendFeedbackNodeModel extends BaseNodeModel {
  constructor({ id, x, y, name, onEnter = [], next = [], isStartNode = false, isHighlighted = false }) {
    super('send_feedback', id)
    this.setData({ name, onEnter, next, isStartNode, isHighlighted })

    this.x = this.oldX = x
    this.y = this.oldY = y
  }
}

export class SendFeedbackWidgetFactory extends AbstractNodeFactory {
  constructor() {
    super('send_feedback')
  }

  generateReactWidget(diagramEngine: DiagramEngine, node: SendFeedbackNodeModel) {
    return <SendFeedbackWidget node={node} diagramEngine={diagramEngine} />
  }

  getNewInstance() {
    // @ts-ignore
    return new SendFeedbackNodeModel()
  }
}
