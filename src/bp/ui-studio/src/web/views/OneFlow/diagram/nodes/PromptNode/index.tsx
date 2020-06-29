import classnames from 'classnames'
import _ from 'lodash'
import React from 'react'
import { AbstractNodeFactory } from 'storm-react-diagrams'
import { BaseNodeModel } from '~/views/FlowBuilder/diagram/nodes/BaseNodeModel'
import {
  StandardIncomingPortModel,
  StandardOutgoingPortModel,
  StandardPortWidget
} from '~/views/FlowBuilder/diagram/nodes/Ports'
import { showHeaderV2 } from '~/views/FlowBuilder/diagram/nodes_v2/utils'

import style from '../../../../FlowBuilder/diagram/nodes_v2/style.scss'

import promptStyle from './style.scss'

class PromptNodeWidget extends React.Component<{ node: PromptNodeModel }> {
  render() {
    const node = this.props.node
    const { type, output } = node.prompt || {}

    return (
      <div
        className={classnames(style.baseNode, promptStyle.nodePrompt, {
          [style.highlightedNode]: node.isHighlighted
        })}
      >
        {showHeaderV2({ nodeType: `Prompt ${type}`, nodeName: node.name, isStartNode: node.isStartNode })}
        <div className={style.content}>
          Output: <b>{output}</b>
        </div>
        <div className={style.ports}>
          <StandardPortWidget name="in" node={node} className={style.in} />
          {node.next?.map((item, i) => {
            const outputPortName = `out${i}`
            return (
              <div key={`${i}.${item}`} style={{ display: 'flex', justifyContent: 'space-between', padding: 1 }}>
                {item.caption}
                <StandardPortWidget name={outputPortName} node={node} className={style.outRouting} />
              </div>
            )
          })}
        </div>
      </div>
    )
  }
}

export class PromptNodeModel extends BaseNodeModel {
  public prompt?

  constructor({ id, x, y, name, next = [], prompt, isStartNode = false, isHighlighted = false }) {
    super('prompt', id)

    this.setData({ name, next, isStartNode, prompt, isHighlighted })

    this.x = this.oldX = x
    this.y = this.oldY = y
  }

  serialize() {
    return _.merge(super.serialize(), {
      name: this.name,
      next: this.next
    })
  }

  deSerialize(data, engine) {
    super.deSerialize(data, engine)

    this.setData(data)
  }

  setData({ name, next = [], isStartNode, prompt, isHighlighted }) {
    this.isStartNode = isStartNode
    this.isHighlighted = isHighlighted
    const inNodeType = isStartNode ? 'start' : 'normal'

    if (!this.ports['in']) {
      this.addPort(new StandardIncomingPortModel('in', inNodeType))
    }

    // We create as many output port as needed
    for (let i = 0; i < next.length; i++) {
      if (!this.ports['out' + i]) {
        this.addPort(new StandardOutgoingPortModel('out' + i))
      }
    }

    if (!_.isArray(next) && _.isObjectLike(next)) {
      next = [next]
    }

    this.prompt = prompt
    this.next = next
    this.name = name
  }
}

export class PromptWidgetFactory extends AbstractNodeFactory {
  constructor() {
    super('prompt')
  }

  generateReactWidget(diagramEngine, node) {
    return <PromptNodeWidget node={node} />
  }

  getNewInstance() {
    // @ts-ignore
    return new PromptNodeModel()
  }
}
