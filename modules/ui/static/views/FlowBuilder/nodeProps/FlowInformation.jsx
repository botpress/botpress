import React, { Component, Fragment } from 'react'
import classnames from 'classnames'

import { Tabs, Tab, Badge } from 'react-bootstrap'

import ActionSection from './ActionSection'
import TransitionSection from './TransitionSection'

const style = require('./style.scss')

export default class FlowPropertiesPanel extends Component {
  render() {
    const { readOnly } = this.props

    const catchAll = Object.assign(
      {
        onReceive: [],
        next: []
      },
      this.props.currentFlow && this.props.currentFlow.catchAll
    )

    return (
      <div className={classnames(style.node)}>
        <Tabs animation={false} id="node-props-modal-flow-tabs">
          <Tab
            eventKey="on_receive"
            title={
              <Fragment>
                <Badge>{(catchAll.onReceive && catchAll.onReceive.length) || 0}</Badge> On Receive
              </Fragment>
            }
          >
            <ActionSection
              readOnly={readOnly}
              items={catchAll.onReceive}
              header="On Receive"
              onItemsUpdated={items => this.props.updateFlow({ catchAll: { ...catchAll, onReceive: items } })}
              copyItem={item => this.props.copyFlowNodeElement({ action: item })}
              pasteItem={() => this.props.pasteFlowNodeElement('onReceive')}
              canPaste={Boolean(this.props.buffer.action)}
            />
          </Tab>
          <Tab
            eventKey="transitions"
            title={
              <Fragment>
                <Badge>{(catchAll.next && catchAll.next.length) || 0}</Badge> Transitions
              </Fragment>
            }
          >
            <TransitionSection
              readOnly={readOnly}
              items={catchAll.next}
              header="Transitions"
              currentFlow={this.props.currentFlow}
              subflows={this.props.subflows}
              onItemsUpdated={items => this.props.updateFlow({ catchAll: { ...catchAll, next: items } })}
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
