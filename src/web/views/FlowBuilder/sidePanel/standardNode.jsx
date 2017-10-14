import React, { Component } from 'react'
import classnames from 'classnames'
import axios from 'axios'
import _ from 'lodash'

import { Row, Col, Panel, Button } from 'react-bootstrap'

import ActionItem from '../common/action'

const style = require('./style.scss')

export default class SidePanel extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  addAction(property, action) {
    const { node } = this.props
    if (!_.isArray(node[property])) {
      node[property] = []
    }

    node[property].push(action)
    // TODO Refresh UI
  }

  render() {
    const { node } = this.props

    const onEnter = node.onEnter || []
    const onReceive = node.onReceive || []
    const next = node.next || []

    return (
      <div className={classnames(style.node, style['standard-node'])}>
        <h4>{node.name}</h4>

        <Panel style={style['section-onEnter']} collapsible defaultExpanded={true} header="On enter">
          {onEnter.map(item => (
            <ActionItem className={style.item} text={item}>
              <div className={style.remove}>
                <a href="#">Remove</a>
              </div>
            </ActionItem>
          ))}
          <div className={style.actions}>
            <Button className={style.addAction}>Add action (Alt+q)</Button>
          </div>
        </Panel>

        <Panel style={style['section-onReceive']} collapsible defaultExpanded={true} header="On receive">
          {onReceive.map(item => <ActionItem className={style.item} text={item} />)}
          <div className={style.actions}>
            <Button className={style.addAction}>Add action (Alt+w)</Button>
          </div>
        </Panel>

        <Panel style={style['section-next']} collapsible defaultExpanded={true} header="Next node">
          {next.map(item => <ActionItem className={style.item} text={item.condition} />)}
          <div className={style.actions}>
            <Button className={style.addAction}>Add condition (Alt+e)</Button>
          </div>
        </Panel>
      </div>
    )
  }
}
