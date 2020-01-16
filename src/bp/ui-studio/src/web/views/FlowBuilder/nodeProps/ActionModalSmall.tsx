import _ from 'lodash'
import React from 'react'

import ActionItem from '../common/action'

import ActionModalForm from './ActionModalForm'

export default class ActionModalSmall extends React.Component<any> {
  state = {
    showActionModalForm: false
  }

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
    this.setState({ showActionModalForm: false })
  }

  render() {
    return (
      <div onDoubleClick={() => this.setState({ showActionModalForm: true })}>
        <ActionItem text={this.props.text} layoutv2 />
        <ActionModalForm
          show={this.state.showActionModalForm}
          onClose={() => this.setState({ showActionModalForm: false, itemToEditIndex: null })}
          onSubmit={this.onSubmitAction}
          item={this.itemToOptions(this.props.text)}
          layoutv2
        />
      </div>
    )
  }
}
