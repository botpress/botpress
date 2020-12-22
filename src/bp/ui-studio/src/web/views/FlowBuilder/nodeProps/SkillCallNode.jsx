import React, { Component, Fragment } from 'react'

import { Panel, Tabs, Tab, Badge, Button } from 'react-bootstrap'

import { AccessControl } from '~/components/Shared/Utils'
import EditableInput from '../common/EditableInput'
import TransitionSection from './TransitionSection'
import { lang } from 'botpress/shared'

const style = require('./style.scss')

export default class SkillCallNodePropertiesPanel extends Component {
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
    const { node, readOnly } = this.props

    const editSkill = () => this.props.requestEditSkill(node.id)

    return (
      <div className={style.node}>
        <Panel>
          <EditableInput
            readOnly={readOnly}
            value={node.name}
            className={style.name}
            onChanged={this.renameNode}
            transform={this.transformText}
          />
          <div style={{ padding: '5px' }}>
            <AccessControl resource="bot.skills" operation="write">
              <Button onClick={editSkill}>{lang.tr('studio.flow.node.editSkill')}</Button>
            </AccessControl>
          </div>
        </Panel>
        <Tabs animation={false} id="node-props-modal-skill-node-tabs">
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
              currentFlow={this.props.flow}
              header={lang.tr('studio.flow.node.transitions')}
              subflows={this.props.subflows}
              onItemsUpdated={items => this.props.updateNode({ next: items })}
            />
          </Tab>
        </Tabs>
      </div>
    )
  }
}
