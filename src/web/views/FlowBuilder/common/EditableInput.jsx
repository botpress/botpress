import React, { Component } from 'react'
import classnames from 'classnames'
import _ from 'lodash'

const style = require('./style.scss')

export default class EditableInput extends Component {
  constructor(props) {
    super(props)
    this.update = this._update
  }

  componentDidMount() {
    this.mapUpdate(this.props)
    this.props.onMount && this.props.onMount(this.input)
  }

  componentDidUpdate() {
    this.mapUpdate(this.props)
  }

  getInput() {
    return this.input
  }

  _update(value) {
    this.props.onChanged && this.props.onChanged(value)
  }

  mapUpdate(props) {
    if (props.debounce) {
      this.update = _.debounce(this._update, props.debounce)
    } else {
      this.update = this._update
    }
  }

  onChanged(event) {
    if (event.target.value !== this.props.value) {
      this.update(event.target.value)
    }
  }

  onKeyDown(event) {
    if (event.keyCode === 13) {
      // Enter
      event.target.blur()
    }
  }

  onBlur(event) {
    if (!this.props.value.length) {
      this.update(this.props.defaultValue || '')
    }
  }

  render() {
    const inputWidth = Math.max(120, 20 + 8 * this.props.value.length) + 'px'
    const inputClass = classnames(style.editableInput, {
      [this.props.className]: true,
      [style.defaultValue]: this.props.value === this.props.defaultValue
    })

    return (
      <input
        className={inputClass}
        type="text"
        ref={el => (this.input = el)}
        style={{ width: inputWidth }}
        autocomplete="off"
        value={this.props.value || this.props.defaultValue}
        onBlur={::this.onBlur}
        onChange={::this.onChanged}
        onKeyDown={::this.onKeyDown}
      />
    )
  }
}
