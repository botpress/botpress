import React, { Component } from 'react'
import {
  Tooltip,
  OverlayTrigger,
  SplitButton,
  MenuItem,
  Glyphicon
} from 'react-bootstrap'

import classnames from 'classnames'
import _ from 'lodash'

const style = require('./style.scss')

export default class ActionsView extends Component {
  constructor(props) {
    super(props)
  }

  renderItem(item, key) {
    return <MenuItem key={key} eventKey={key}
      onClick={() => this.props.add(item.template)}>
        {item.type}
      </MenuItem>
  }

  renderSelectorButton(items, key) {
    if (!items) {
      return null
    }

    return <SplitButton id={key}
        key={key} bsStyle='default' title={key}>
      {_.map(items, ::this.renderItem)}
    </SplitButton>
  }

  renderError() {
    if (!this.props.error) {
      return null
    }

    const tooltip = <Tooltip id="tooltip">
        {this.props.error}
      </Tooltip>

    return <OverlayTrigger placement="bottom" overlay={tooltip}>
      <Glyphicon glyph="glyphicon glyphicon-info-sign" />
    </OverlayTrigger>
  }

  render() {
    const classNames = classnames({
      [style.actions]: true,
      'bp-umm-actions': true
    })

    return <div className={classNames}>
        {_.map(this.props.templates, ::this.renderSelectorButton)}
        {this.renderError()}
      </div>
  } 
}
