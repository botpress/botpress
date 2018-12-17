import React, { Component } from 'react'
import { FormControl } from 'react-bootstrap'
import omit from 'lodash/omit'

// This component is basically a wrapper over FormControl intended to workaround
// onChange firing before IME composition ends (https://github.com/facebook/react/issues/3926)
export class FormControlIme extends Component {
  onChange = e => {
    if (e.nativeEvent.isComposing) {
      return
    }
    this.props.onChange(e)
  }

  setValueFromProps = () => {
    this.input.value = this.props.value || ''
  }

  componentDidMount = this.setValueFromProps
  componentDidUpdate = this.setValueFromProps

  render() {
    return (
      <FormControl
        {...omit(this.props, 'value')}
        inputRef={ref => (this.input = ref)}
        onChange={this.onChange}
        onCompositionEnd={this.onChange}
      />
    )
  }
}
