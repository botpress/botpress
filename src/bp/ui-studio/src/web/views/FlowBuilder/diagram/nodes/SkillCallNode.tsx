import { Icon } from '@blueprintjs/core'
import classnames from 'classnames'
import _ from 'lodash'
import React from 'react'
import { connect } from 'react-redux'
import { AbstractNodeFactory } from 'storm-react-diagrams'

import ActionItem from '../../common/action'
import ConditionItem from '../../common/condition'
import { SkillDefinition } from '../../sidePanel/FlowTools'

import { BaseNodeModel } from './BaseNodeModel'
import { StandardIncomingPortModel, StandardOutgoingPortModel, StandardPortWidget } from './Ports'

const style = require('./style.scss')

class SkillCallNodeWidget extends React.Component<{ node: SkillCallNodeModel; skills: SkillDefinition[] }> {
  render() {
    const node = this.props.node
    const isWaiting = node.waitOnReceive

    const className = classnames(style['skill-call-node'], style['node-container'], {
      [style.highlightedNode]: node.isHighlighted
    })

    const definition = this.props.skills && this.props.skills.find(x => x.id === node.skill)
    const icon: any = definition && definition.icon

    return (
      <div className={className}>
        <div className={style.topPort}>
          <StandardPortWidget name="in" node={node} />
        </div>
        <div className={style.header} />
        <div className={style.content}>
          <div className={classnames(style['section-title'], style.section, { [style.waiting]: isWaiting })}>
            <div className={style.iconContainer}>
              <Icon icon={icon} iconSize={20} />
            </div>
            <div>
              <div>{node.skill}</div>
              <div className={style['subtitle']}>Skill | {node.name}</div>
            </div>
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

export class SkillCallNodeModel extends BaseNodeModel {
  public skill?

  constructor({ id, x, y, name, skill, next = [], isStartNode = false, isHighlighted = false }) {
    super('skill-call', id)

    this.setData({ name, next, isStartNode, skill, isHighlighted })

    this.x = this.oldX = x
    this.y = this.oldY = y
  }

  serialize() {
    return _.merge(super.serialize(), {
      name: this.name,
      next: this.next,
      skill: this.skill
    })
  }

  deSerialize(data, engine) {
    super.deSerialize(data, engine)

    this.setData(data)
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

export class SkillCallWidgetFactory extends AbstractNodeFactory {
  private skillsDefinitions: SkillDefinition[]

  constructor(skills) {
    super('skill-call')
    this.skillsDefinitions = skills
  }

  generateReactWidget(diagramEngine, node) {
    return <SkillCallNodeWidget node={node} skills={this.skillsDefinitions} />
  }

  getNewInstance() {
    // @ts-ignore
    return new SkillCallNodeModel()
  }
}
