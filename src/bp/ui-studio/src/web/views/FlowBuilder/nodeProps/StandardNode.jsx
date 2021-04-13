import { lang } from 'botpress/shared'
import React, { Component, Fragment } from 'react'

import { Tabs, Tab, Badge, Panel } from 'react-bootstrap'

import EditableInput from '../common/EditableInput'

import ActionSection from './ActionSection'
import TransitionSection from './TransitionSection'

const style = require('./style.scss')

export default class StandardNodePropertiesPanel extends Component {
  renameNode = text => {
    if (text) {
      const alreadyExists = this.props.flow.nodes.find(x => x.name === text)
      if (!alreadyExists) {
        this.props.updateNode({ name: text })
      }
    }
  }

  transformText(text) {
    return text.replace(/[^a-z0-9-_\.]/gi, '_')
  }

  render() {
    const { node, readOnly, isLastNode } = this.props

    return (
      <div className={style.node}>
        <Panel>
          <EditableInput
            /* We should always sugest that the name should be changed
             if the node has the default name and it is the last created */
            key={node.id}
            shouldFocus={isLastNode && node.name.match(/node-(\w|\n){4}$/g)}
            readOnly={readOnly}
            value={node.name}
            className={style.name}
            onChanged={this.renameNode}
            transform={this.transformText}
          />
        </Panel>
        <Tabs animation={false} id="node-props-modal-standard-node-tabs">
          {!this.props.transitionOnly && (
            <Tab
              eventKey="on_enter"
              title={
                <Fragment>
                  <Badge>{(node.onEnter && node.onEnter.length) || 0}</Badge> {lang.tr('studio.flow.node.onEnter')}
                </Fragment>
              }
            >
              <ActionSection
                readOnly={readOnly}
                items={node.onEnter}
                header={lang.tr('studio.flow.node.onEnter')}
                onItemsUpdated={items => this.props.updateNode({ onEnter: items })}
                copyItem={item => this.props.copyFlowNodeElement({ action: item })}
                pasteItem={() => this.props.pasteFlowNodeElement('onEnter')}
                canPaste={Boolean(this.props.buffer.action)}
              />
            </Tab>
          )}
          {!this.props.transitionOnly && (
            <Tab
              eventKey="on_receive"
              title={
                <Fragment>
                  <Badge>{(node.onReceive && node.onReceive.length) || 0}</Badge>{' '}
                  {lang.tr('studio.flow.node.onReceive')}
                </Fragment>
              }
            >
              <ActionSection
                readOnly={readOnly}
                items={node.onReceive}
                header={lang.tr('studio.flow.node.onReceive')}
                waitable
                onItemsUpdated={items => this.props.updateNode({ onReceive: items })}
                copyItem={item => this.props.copyFlowNodeElement({ action: item })}
                pasteItem={() => this.props.pasteFlowNodeElement('onReceive')}
                canPaste={Boolean(this.props.buffer.action)}
              />
            </Tab>
          )}
          <Tab
            eventKey="transitions"
            title={
              <Fragment>
                <Badge>{(node.next && node.next.length) || 0}</Badge> {lang.tr('studio.flow.node.transitions')}
              </Fragment>
            }
          >
            <TransitionSection
              readOnly={readOnly}
              items={node.next}
              header={lang.tr('studio.flow.node.transitions')}
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
