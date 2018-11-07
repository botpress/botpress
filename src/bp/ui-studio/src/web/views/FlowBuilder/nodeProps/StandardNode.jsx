import React, { Component, Fragment } from 'react'

import { Tabs, Tab, Badge, Panel } from 'react-bootstrap'

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
    const { node, readOnly } = this.props

    const onNameMounted = input => {
      if (input.value.startsWith('node-')) {
        input.focus()
        input.setSelectionRange(0, 1000)
      }
    }

    return (
      <div className={style.node}>
        <Panel>
          <EditableInput
            readOnly={readOnly}
            onMount={onNameMounted}
            value={node.name}
            className={style.name}
            onChanged={this.renameNode}
            transform={this.transformText}
          />
        </Panel>
        <Tabs animation={false} id="node-props-modal-standard-node-tabs">
          <Tab
            eventKey="on_enter"
            title={
              <Fragment>
                <Badge>{(node.onEnter && node.onEnter.length) || 0}</Badge> On Enter
              </Fragment>
            }
          >
            <ActionSection
              readOnly={readOnly}
              items={node.onEnter}
              header="On Enter"
              onItemsUpdated={items => this.props.updateNode({ onEnter: items })}
              copyItem={item => this.props.copyFlowNodeElement({ action: item })}
              pasteItem={() => this.props.pasteFlowNodeElement('onEnter')}
              canPaste={Boolean(this.props.buffer.action)}
            />
          </Tab>
          <Tab
            eventKey="on_receive"
            title={
              <Fragment>
                <Badge>{(node.onReceive && node.onReceive.length) || 0}</Badge> On Receive
              </Fragment>
            }
          >
            <ActionSection
              readOnly={readOnly}
              items={node.onReceive}
              header="On Receive"
              waitable={true}
              onItemsUpdated={items => this.props.updateNode({ onReceive: items })}
              copyItem={item => this.props.copyFlowNodeElement({ action: item })}
              pasteItem={() => this.props.pasteFlowNodeElement('onReceive')}
              canPaste={Boolean(this.props.buffer.action)}
            />
          </Tab>
          <Tab
            eventKey="transitions"
            title={
              <Fragment>
                <Badge>{(node.next && node.next.length) || 0}</Badge> Transitions
              </Fragment>
            }
          >
            <TransitionSection
              readOnly={readOnly}
              items={node.next}
              header="Transitions"
              currentFlow={this.props.flow}
              currentNodeName={node.name}
              subflows={this.props.subflows}
              onItemsUpdated={items => this.props.updateNode({ next: items })}
              copyItem={item => this.props.copyFlowNodeElement({ transition: item })}
              pasteItem={() => this.props.pasteFlowNodeElement('next')}
              canPaste={Boolean(this.props.buffer.transition)}
            />
          </Tab>
        </Tabs>
      </div>
    )
  }
}
