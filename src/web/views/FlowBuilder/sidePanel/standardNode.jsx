import React, { Component } from 'react'
import classnames from 'classnames'
import axios from 'axios'
import _ from 'lodash'

import { Row, Col, Panel, Button } from 'react-bootstrap'

const style = require('./style.scss')

export default class SidePanel extends Component {
  constructor(props) {
    super(props)
    this.state = {
      // Node properties
      name: '',
      onEnter: [],
      onReceived: [],
      next: [],

      // UI properties
      onEnterOpen: true,
      onReceiveOpen: true,
      nextOpen: true
    }
  }

  render() {
    const { node } = this.props

    const getActionStyle = item => (item.startsWith('@') ? style.msg : style.fn)

    return (
      <div className={classnames(style.node, style['standard-node'])}>
        <h4>{node.name}</h4>

        <Panel style={style['section-onEnter']} collapsible defaultExpanded={this.state.onEnterOpen} header="On enter">
          {node.onEnter &&
            node.onEnter.map(item => {
              return <div className={getActionStyle(item)}>{item}</div>
            })}
          <div className={style.actions}>
            <Button className={style.addAction}>Add action</Button>
          </div>
        </Panel>

        <Panel
          style={style['section-onReceive']}
          collapsible
          defaultExpanded={this.state.onReceiveOpen}
          header="On receive"
        >
          {node.onReceive &&
            node.onReceive.map(item => {
              return <div className={getActionStyle(item)}>{item}</div>
            })}
          <div className={style.actions}>
            <Button className={style.addAction}>Add action</Button>
          </div>
        </Panel>

        <Panel style={style['section-next']} collapsible defaultExpanded={this.state.nextOpen} header="Next node">
          {node.next &&
            node.next.map(item => {
              return <div>{item.condition}</div>
            })}
          <div className={style.actions}>
            <Button className={style.addAction}>Add condition</Button>
          </div>
        </Panel>
      </div>
    )
  }
}
