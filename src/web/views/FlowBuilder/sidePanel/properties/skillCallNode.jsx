import React, { Component } from 'react'
import { Button } from 'react-bootstrap'

import classnames from 'classnames'

import EditableInput from '../../common/EditableInput'
import TransitionSection from './TransitionSection'

const style = require('../style.scss')

export default class SkillCallNodePropertiesPanel extends Component {
  renameNode(text) {
    if (text.length > 0 && text !== this.props.node.name) {
      this.props.updateNode({ name: text })
    }
  }

  transformText(text) {
    return text.replace(/[^a-z0-9-_\.]/gi, '_')
  }

  render() {
    const { node } = this.props

    const onNameMounted = input => {
      if (input.value.startsWith('node-')) {
        input.focus()
        input.setSelectionRange(0, 1000)
      }
    }

    const editSkill = () => this.props.requestEditSkill(node.id)
    const seeFlow = () => this.props.switchFlow(node.flow)

    return (
      <div className={classnames(style.node, style['node-panel'])}>
        <EditableInput
          onMount={onNameMounted}
          value={node.name}
          className={style.name}
          onChanged={::this.renameNode}
          transform={this.transformText}
        />
        <div style={{ padding: '5px' }}>
          <Button onClick={editSkill}>Edit skill</Button>
          <Button onClick={seeFlow}>See flow</Button>
        </div>
        <TransitionSection
          items={node['next']}
          header="Transitions"
          subflows={this.props.subflows}
          onItemsUpdated={items => this.props.updateNode({ next: items })}
        />
      </div>
    )
  }
}
