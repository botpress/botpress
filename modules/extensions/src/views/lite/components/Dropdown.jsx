import React from 'react'
import Select from 'react-select'
import Creatable from 'react-select/lib/Creatable'
import { renderUnsafeHTML } from '../utils'

export class Dropdown extends React.Component {
  state = {
    options: []
  }

  componentDidMount() {
    if (this.props.options) {
      const options = this.props.options.map(x => {
        return {
          value: x.value || x.label,
          label: x.label
        }
      })
      this.setState({ options })
    }
  }

  handleChange = selectedOption => {
    this.setState({ selectedOption }, () => {
      if (!this.props.buttonText) {
        this.sendChoice()
      }
    })
  }

  sendChoice = () => {
    const { selectedOption } = this.state
    if (!selectedOption) {
      return
    }

    let { label, value } = this.state.selectedOption

    if (selectedOption.length) {
      label = selectedOption.map(x => x.label).join(',')
      value = selectedOption.map(x => x.value || x.label).join(',')
    }

    this.props.onSendData && this.props.onSendData({ type: 'quick_reply', text: label, payload: value || label })
  }

  renderSelect(inKeyboard) {
    return (
      <div className={inKeyboard && 'bpw-keyboard-quick_reply-dropdown'}>
        <div style={{ width: +this.props.width || 210, display: 'inline-block', marginRight: 15 }}>
          {this.props.allowCreation ? (
            <Creatable
              value={this.state.selectedOption}
              onChange={this.handleChange}
              options={this.state.options}
              placeholder={this.props.placeholderText}
              isMulti={this.props.allowMultiple}
              menuPlacement={'top'}
            />
          ) : (
            <Select
              value={this.state.selectedOption}
              onChange={this.handleChange}
              options={this.state.options}
              placeholder={this.props.placeholderText}
              isMulti={this.props.allowMultiple}
              menuPlacement={'top'}
            />
          )}
        </div>

        {this.props.buttonText && (
          <button className="bpw-button" onClick={this.sendChoice}>
            {this.props.buttonText}
          </button>
        )}
      </div>
    )
  }

  render() {
    const shouldDisplay = this.props.isLastGroup && this.props.isLastOfGroup
    let message
    if (this.props.markdown) {
      const html = renderUnsafeHTML(this.props.message, this.props.store.escapeHTML)
      message = <div dangerouslySetInnerHTML={{ __html: html }} />
    } else {
      message = <p>{this.props.message}</p>
    }
    if (this.props.displayInKeyboard) {
      const Keyboard = this.props.keyboard

      return (
        <Keyboard.Prepend keyboard={this.renderSelect(true)} visible={shouldDisplay}>
          {message}
        </Keyboard.Prepend>
      )
    }

    return (
      <div>
        {message}
        {shouldDisplay && this.renderSelect()}
      </div>
    )
  }
}
