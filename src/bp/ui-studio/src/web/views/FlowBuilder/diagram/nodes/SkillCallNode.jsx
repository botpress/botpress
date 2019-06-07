import React, { Component } from 'react'
import classnames from 'classnames'
import _ from 'lodash'
import { NodeModel, NodeFactory } from 'storm-react-diagrams'

import ActionItem from '../../common/action'
import ConditionItem from '../../common/condition'
import { StandardOutgoingPortModel, StandardPortWidget, StandardIncomingPortModel } from './Ports'

const style = require('./style.scss')

export class SkillCallNodeWidget extends React.Component {
  static defaultProps = {
    size: 200,
    node: null
  }

  state = {}

  render() {
    const node = this.props.node
    const isWaiting = node.waitOnReceive

    const className = classnames(style['skill-call-node'], style['node-container'], {
      [style.highlightedNode]: node.isHighlighted
    })

    return (
      <div className={className}>
        <div className={style.topPort}>
          <StandardPortWidget name="in" node={node} />
        </div>
        <div className={style.header} />
        <div className={style.content}>
          <div className={classnames(style['section-title'], style.section, { [style.waiting]: isWaiting })}>
            <div>{node.skill}</div>
            <div className={style['subtitle']}>Skill | {node.name}</div>
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
                    <StandardPortWidget name={outputPortName} node={node} />
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

export class SkillCallNodeModel extends NodeModel {
  constructor({ id, x, y, name, skill, next = [], isStartNode = false, isHighlighted = false }) {
    super('skill-call', id)

    this.setData({ name, next, isStartNode, skill, isHighlighted })

    if (x) {
      this.x = x
    }
    if (y) {
      this.y = y
    }
  }

  serialize() {
    return _.merge(super.serialize(), {
      name: this.name,
      next: this.next,
      skill: this.skill
    })
  }

  deSerialize(data) {
    super.deSerialize(data)

    this.setData({ name: data.name, skill: data.skill, next: data.next })
  }

  getOutPorts() {
    return _.filter(_.values(this.ports), p => p.name.startsWith('out'))
  }

  setData({ name, next = [], isStartNode, skill, isHighlighted }) {
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

    this.skill = skill
    this.next = next
    this.name = name
  }
}

export const SkillCallNodeWidgetFactory = React.createFactory(SkillCallNodeWidget)

export class SkillCallWidgetFactory extends NodeFactory {
  constructor() {
    super('skill-call')
  }

  generateReactWidget(diagramEngine, node) {
    return SkillCallNodeWidgetFactory({ node })
  }
}
