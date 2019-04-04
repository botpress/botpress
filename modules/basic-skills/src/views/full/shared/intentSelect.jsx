import React from 'react'
import Select from 'react-select'

export class SelectIntent extends React.Component {
  state = {
    intent: undefined
  }

  render() {
    return (
      <Select
        id="intent"
        name="intent"
        isSearchable={true}
        onChange={this.props.onChange}
        value={this.props.value}
        options={this.props.intents.map(intent => {
          return { value: intent.name, label: intent.name }
        })}
      />
    )
  }
}
