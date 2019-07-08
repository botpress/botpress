import { observe } from 'mobx'
import { inject, observer } from 'mobx-react'
import React from 'react'
import { FormattedMessage, InjectedIntlProps, injectIntl } from 'react-intl'

import { RootStore, StoreDef } from '../store'

class Composer extends React.Component<ComposerProps> {
  private textInput: any
  constructor(props) {
    super(props)
    this.textInput = React.createRef()
  }

  componentDidMount() {
    setTimeout(() => {
      this.textInput.current.focus()
    }, 0)

    observe(this.props.focusedArea, focus => {
      focus.newValue === 'input' && this.textInput.current.focus()
    })
  }

  handleKeyPress = async e => {
    if (this.props.enableResetSessionShortcut && e.ctrlKey && e.key === 'Enter') {
      e.preventDefault()
      await this.props.resetSession()
      await this.props.sendMessage()
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      await this.props.sendMessage()
    }
  }

  handleKeyDown = e => {
    if (this.props.enableArrowNavigation) {
      const shouldFocusPrevious = e.target.selectionStart === 0 && (e.key === 'ArrowUp' || e.key === 'ArrowLeft')
      if (shouldFocusPrevious) {
        this.props.focusPrevious()
      }

      const shouldFocusNext =
        e.target.selectionStart === this.textInput.current.value.length &&
        (e.key === 'ArrowDown' || e.key === 'ArrowRight')
      if (shouldFocusNext) {
        this.props.focusNext()
      }
    } else if (e.key == 'ArrowUp' || e.key == 'ArrowDown') {
      this.props.recallHistory(e.key)
    }
  }

  handleMessageChanged = e => this.props.updateMessage(e.target.value)

  render() {
    const placeholder = this.props.intl.formatMessage({ id: 'composer.placeholder' }, { name: this.props.botName })
    return (
      <div className={'bpw-composer'}>
        <div className={'bpw-composer-inner'}>
          <textarea
            tabIndex={1}
            ref={this.textInput}
            onFocus={this.props.setFocus.bind(this, 'input')}
            placeholder={placeholder}
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
  intl: store.intl,
  updateMessage: store.composer.updateMessage,
  sendMessage: store.sendMessage,
  recallHistory: store.composer.recallHistory,
  botName: store.botName,
  setFocus: store.view.setFocus,
  focusedArea: store.view.focusedArea,
  focusPrevious: store.view.focusPrevious,
  focusNext: store.view.focusNext,
  enableArrowNavigation: store.config.enableArrowNavigation,
  enableResetSessionShortcut: store.config.enableResetSessionShortcut,
  resetSession: store.resetSession
}))(observer(Composer))

type ComposerProps = {
  focused: boolean
  placeholder: string
} & InjectedIntlProps &
  Pick<
    StoreDef,
    | 'botName'
    | 'intl'
    | 'focusedArea'
    | 'sendMessage'
    | 'focusPrevious'
    | 'focusNext'
    | 'recallHistory'
    | 'setFocus'
    | 'updateMessage'
    | 'message'
    | 'enableArrowNavigation'
    | 'resetSession'
    | 'enableResetSessionShortcut'
  >
