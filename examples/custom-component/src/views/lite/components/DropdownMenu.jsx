import React from 'react'
import Select from 'react-select'

export class DropdownMenu extends React.Component {
  state = {
    options: []
  }

  componentDidMount() {
    if (this.props.options) {
      const options = this.props.options.map(x => {
        return { value: x, label: x }
      })
      this.setState({ options })
    }
  }

  handleChange = selectedOption => {
    this.setState({ selectedOption })
  }

  sendChoice = () => {
    if (!this.state.selectedOption) {
      return
    }

    // Text or anything else
    this.props.onSendData({ type: 'text', text: this.state.selectedOption.value })
  }

  renderSelect() {
    const customStyles = {
      control: base => ({ ...base, height: '30px', 'min-height': '30px' }),
      dropdownIndicator: base => ({ ...base, padding: 4 }),
      clearIndicator: base => ({ ...base, padding: 4 }),
      valueContainer: base => ({ ...base, padding: '0px 6px' }),
      input: base => ({ ...base, margin: 0, padding: 0 }),
      option: base => ({ ...base, padding: 5 })
    }

    return (
      <React.Fragment>
        <Select
          styles={customStyles}
          value={this.state.selectedOption}
          onChange={this.handleChange}
          options={this.state.options}
        />
        <button onClick={this.sendChoice}>Validate</button>
      </React.Fragment>
    )
  }

  render() {
    return (
      <div style={{ minWidth: '180px' }}>
        {this.props.isLastGroup ? this.renderSelect() : 'already picked something'}
      </div>
    )
  }
}
