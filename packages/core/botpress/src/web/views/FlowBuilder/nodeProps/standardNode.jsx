import React, { Component } from 'react'
import classnames from 'classnames'

import EditableInput from '../common/EditableInput'

import ActionSection from './ActionSection'
import TransitionSection from './TransitionSection'

const style = require('./style.scss')

export default class StandardNodePropertiesPanel extends Component {
  renameNode = text => {
    if (text && text !== this.props.node.name) {
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

    return (
      <div className={classnames(style.node, style['node-panel'])}>
        <EditableInput
          onMount={onNameMounted}
          value={node.name}
          className={style.name}
          onChanged={this.renameNode}
          transform={this.transformText}
        />
        <ActionSection
          items={node.onEnter}
          header="On Enter"
          onItemsUpdated={items => this.props.updateNode({ onEnter: items })}
          copyItem={item => this.props.copyFlowNodeElement({ action: item })}
          pasteItem={() => this.props.pasteFlowNodeElement('onEnter')}
          canPaste={Boolean(this.props.buffer.action)}
        />
        <ActionSection
          items={node.onReceive}
          header="On Receive"
          waitable={true}
          onItemsUpdated={items => this.props.updateNode({ onReceive: items })}
          copyItem={item => this.props.copyFlowNodeElement({ action: item })}
          pasteItem={() => this.props.pasteFlowNodeElement('onReceive')}
          canPaste={Boolean(this.props.buffer.action)}
        />
        <TransitionSection
          items={node.next}
          header="Transitions"
          subflows={this.props.subflows}
          onItemsUpdated={items => this.props.updateNode({ next: items })}
          copyItem={item => this.props.copyFlowNodeElement({ transition: item })}
          pasteItem={() => this.props.pasteFlowNodeElement('next')}
          canPaste={Boolean(this.props.buffer.transition)}
        />
      </div>
    )
  }
}
