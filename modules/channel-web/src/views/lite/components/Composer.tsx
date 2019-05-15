import { inject, observer } from 'mobx-react'
import React from 'react'
import { FormattedMessage, InjectedIntlProps, injectIntl } from 'react-intl'

import { RootStore, StoreDef } from '../store'

class Composer extends React.Component<ComposerProps> {
  private textInput: any

  componentDidMount() {
    this.textInput.focus()
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.focused && this.props.focused) {
      this.textInput.focus()
    }
  }

  handleKeyPress = e => {
    if (e.key === 'Enter') {
      this.props.sendMessage()
      e.preventDefault()
    }
  }

  handleKeyDown = e => {
    if (this.props.enableArrowNavigation) {
      const shouldFocusPrevious = e.target.selectionStart === 0 && (e.key === 'ArrowUp' || e.key === 'ArrowLeft')
      if (shouldFocusPrevious) {
        this.props.focusPrevious()
      }

      const shouldFocusNext =
        e.target.selectionStart === this.textInput.value.length && (e.key === 'ArrowDown' || e.key === 'ArrowRight')
      if (shouldFocusNext) {
        this.props.focusNext()
      }
    } else if (e.key == 'ArrowUp' || e.key == 'ArrowDown') {
      this.props.recallHistory(e.key)
    }
  }

  handleMessageChanged = e => this.props.updateMessage(e.target.value)

  render() {
    return (
      <div className={'bpw-composer'}>
        <div className={'bpw-composer-inner'}>
          <textarea
            tabIndex={1}
            ref={input => {
              this.textInput = input
            }}
            onFocus={this.props.setFocus.bind(this, 'input')}
            placeholder={this.props.placeholder}
            onChange={this.handleMessageChanged}
            value={this.props.message}
            onKeyPress={this.handleKeyPress}
            onKeyDown={this.handleKeyDown}
          />

          <button
            className={'bpw-send-button'}
            disabled={!this.props.message.length}
            onClick={this.props.sendMessage.bind(this, undefined)}
          >
            <FormattedMessage id={'composer.send'} />
          </button>
        </div>
      </div>
    )
  }
}

export default inject(({ store }: { store: RootStore }) => ({
  message: store.composer.message,
  updateMessage: store.composer.updateMessage,
  sendMessage: store.sendMessage,
  recallHistory: store.composer.recallHistory,
  setFocus: store.view.setFocus,
  focusPrevious: store.view.focusPrevious,
  focusNext: store.view.focusNext,
  enableArrowNavigation: store.config.enableArrowNavigation
}))(injectIntl(observer(Composer)))

type ComposerProps = {
  focused: boolean
  placeholder: string
} & InjectedIntlProps &
  Pick<
    StoreDef,
    | 'sendMessage'
    | 'focusPrevious'
    | 'focusNext'
    | 'recallHistory'
    | 'setFocus'
    | 'updateMessage'
    | 'message'
    | 'enableArrowNavigation'
  >
