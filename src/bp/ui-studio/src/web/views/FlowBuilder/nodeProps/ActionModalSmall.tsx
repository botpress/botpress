import { Button } from '@blueprintjs/core'
import _ from 'lodash'
import React, { Fragment } from 'react'

import ActionItem from '../common/action'

import ActionModalForm from './ActionModalForm'

export default class ActionModalSmall extends React.Component<any> {
  itemToOptions(item) {
    if (item && item.startsWith('say ')) {
      const chunks = item.split(' ')
      let text = item
      if (chunks.length > 2) {
        text = _.slice(chunks, 2).join(' ')
      }

      return { type: 'message', message: text }
    } else if (item) {
      const params = item.includes(' ') ? JSON.parse(item.substring(item.indexOf(' ') + 1)) : {}
      return {
        type: 'code',
        functionName: item.split(' ')[0],
        parameters: params
      }
    }
  }

  optionsToItem(options) {
    return options.functionName + ' ' + JSON.stringify(options.parameters || {})
  }

  onSubmitAction = content => {
    this.props.onChange(this.optionsToItem(content))
    this.props.hideModal()
  }

  render() {
    return (
      <Fragment>
        <Button onClick={this.props.showModal}>
          <ActionItem text={this.props.text} layoutv2 />
        </Button>
        <ActionModalForm
          show={this.props.showingModal}
          onClose={this.props.hideModal}
          onSubmit={this.onSubmitAction}
          item={this.itemToOptions(this.props.text)}
          layoutv2
        />
      </Fragment>
    )
  }
}
