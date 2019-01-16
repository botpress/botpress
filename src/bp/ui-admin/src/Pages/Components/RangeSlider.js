import React, { Component } from 'react'

export default class RangeSlider extends Component {
  constructor(props) {
    super(props)

    this.state = {
      value: props.initialValue || 1
    }
  }

  componentDidUpdate(prevprops) {
    if (prevprops.initialValue !== this.props.initialValue) {
      this.setState({ value: this.props.initialValue })
    }
  }

  handleInputChanged = e => {
    this.setState({ value: e.target.valueAsNumber })
    this.props.onUpdate(e.target.valueAsNumber)
  }

  render() {
    return (
      <div className="form-range">
        <input
          type="range"
          min={this.props.min || 0}
          max={this.props.max || 10}
          step={this.props.step || 1}
          className="custom-range"
          id="admin"
          value={this.state.value}
          onChange={this.handleInputChanged}
        />
        <span className="form-range__value">{this.state.value}</span>
      </div>
    )
  }
}
