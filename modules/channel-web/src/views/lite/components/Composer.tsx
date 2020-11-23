import { observe } from 'mobx'
import { inject, observer } from 'mobx-react'
import React from 'react'
import { FormattedMessage, InjectedIntlProps, injectIntl } from 'react-intl'

import ToolTip from '../../../../../../src/bp/ui-shared-lite/ToolTip'
import Send from '../icons/Send'
import { RootStore, StoreDef } from '../store'

class Composer extends React.Component<ComposerProps> {
  private textInput: React.RefObject<HTMLTextAreaElement>
  constructor(props) {
    super(props)
    this.textInput = React.createRef()
  }

  componentDidMount() {
    setTimeout(() => {
      this.textInput.current.focus()
    }, 50)

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
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      this.props.recallHistory(e.key)
    }
  }

  handleMessageChanged = e => this.props.updateMessage(e.target.value)

  isLastMessageFromBot = (): boolean => {
    return this.props.currentConversation &&
      this.props.currentConversation.messages &&
      this.props.currentConversation.messages.length &&
      !this.props.currentConversation.messages.slice(-1).pop().userId
  }

  render() {
    const placeholder =
      this.props.composerPlaceholder ||
      this.props.intl.formatMessage({
        id: this.isLastMessageFromBot() ? 'composer.placeholder' : 'composer.placeholderInit' }, { name: this.props.botName })

    return (
      <div role="region" className={'bpw-composer'}>
        <div className={'bpw-composer-inner'}>
          <textarea
            ref={this.textInput}
            id="input-message"
            onFocus={this.props.setFocus.bind(this, 'input')}
            placeholder={placeholder}
            onChange={this.handleMessageChanged}
            value={this.props.message}
            onKeyPress={this.handleKeyPress}
            onKeyDown={this.handleKeyDown}
            aria-label={this.props.intl.formatMessage({
              id: 'composer.message',
              defaultMessage: 'Message to send'
            })}
          />
          <label htmlFor="input-message" style={{ display: 'none' }}>
            {placeholder}
          </label>

          <ToolTip childId="btn-send" content={this.props.isEmulator ? 'Interact with your chatbot' : 'Send Message'}>
            <button
              className={'bpw-send-button'}
              disabled={!this.props.message.length}
              onClick={this.props.sendMessage.bind(this, undefined)}
              aria-label={this.props.intl.formatMessage({
                id: 'composer.send',
                defaultMessage: 'Send'
              })}
              id="btn-send"
            >
              <FormattedMessage id={'composer.send'} />
            </button>
          </ToolTip>
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
  composerPlaceholder: store.composer.composerPlaceholder,
  setFocus: store.view.setFocus,
  focusedArea: store.view.focusedArea,
  focusPrevious: store.view.focusPrevious,
  focusNext: store.view.focusNext,
  enableArrowNavigation: store.config.enableArrowNavigation,
  enableResetSessionShortcut: store.config.enableResetSessionShortcut,
  resetSession: store.resetSession,
  currentConversation: store.currentConversation,
  isEmulator: store.isEmulator
}))(injectIntl(observer(Composer)))

type ComposerProps = {
  focused: boolean
  composerPlaceholder: string
} & InjectedIntlProps &
  Pick<
    StoreDef,
    | 'botName'
    | 'composerPlaceholder'
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
    | 'isEmulator'
    | 'enableResetSessionShortcut'
    | 'currentConversation'
  >
