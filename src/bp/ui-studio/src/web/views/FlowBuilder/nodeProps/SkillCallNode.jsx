import React, { Component, Fragment } from 'react'

import { Panel, Tabs, Tab, Badge, Button } from 'react-bootstrap'

import PermissionsChecker from '~/components/Layout/PermissionsChecker'
import EditableInput from '../common/EditableInput'
import TransitionSection from './TransitionSection'

const style = require('./style.scss')

export default class SkillCallNodePropertiesPanel extends Component {
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

    const editSkill = () => this.props.requestEditSkill(node.id)

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
          <div style={{ padding: '5px' }}>
            <PermissionsChecker user={this.props.user} op="write" res="bot.skills">
              <Button onClick={editSkill}>Edit skill</Button>
            </PermissionsChecker>
          </div>
        </Panel>
        <Tabs animation={false} id="node-props-modal-skill-node-tabs">
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
              subflows={this.props.subflows}
              onItemsUpdated={items => this.props.updateNode({ next: items })}
            />
          </Tab>
        </Tabs>
      </div>
    )
  }
}
