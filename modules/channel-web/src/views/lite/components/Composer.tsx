import classNames from 'classnames'
import debounce from 'lodash/debounce'
import { observe } from 'mobx'
import { inject, observer } from 'mobx-react'
import React from 'react'
import { FormattedMessage, InjectedIntlProps, injectIntl } from 'react-intl'

import ToolTip from '../../../../../../packages/ui-shared-lite/ToolTip'
import { RootStore, StoreDef } from '../store'
import { isRTLText } from '../utils'
import SuggestionList from './SuggestionList'

import VoiceRecorder from './VoiceRecorder'

const ENTER_CHAR_CODE = 13
class Composer extends React.Component<ComposerProps, StateProps> {
  private textInput: React.RefObject<HTMLTextAreaElement>
  constructor(props) {
    super(props)
    this.textInput = React.createRef()
    this.state = { isRecording: false, isLoading: false, suggestions: [] }
  }

  componentDidMount() {
    this.focus()

    observe(this.props.focusedArea, focus => {
      focus.newValue === 'input' && this.textInput.current.focus()
    })
  }

  componentWillReceiveProps(newProps: Readonly<ComposerProps>) {
    // Focus on the composer when it's unlocked
    if (this.props.composerLocked === true && newProps.composerLocked === false) {
      this.focus()
    }
  }

  focus = () => {
    setTimeout(() => {
      this.textInput.current.focus()
    }, 50)
  }

  handleKeyPress = async e => {
    if (this.props.enableResetSessionShortcut && e.ctrlKey && e.charCode === ENTER_CHAR_CODE) {
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

  fetchSuggestions = debounce(msg => {
    // TODO: API 콜로 변경하기
    if (msg.includes('오류')) {
      this.setState({
        suggestions: ['오류 파드 보여줘', '오류 리소스 보여줘', '오류 영구 볼륨 클레임 보여줘']
      })
    }
    if (msg.includes('사전')) {
      this.setState({
        suggestions: ['k8s 용어 사전']
      })
    }
    this.setState({ isLoading: false })
  }, 500)

  handleMessageChanged = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { updateMessage, composerMaxTextLength } = this.props

    const msg = e.target.value.slice(0, composerMaxTextLength)

    this.setState({ isLoading: true, suggestions: [] })
    updateMessage(msg)
    this.fetchSuggestions(msg)
  }

  handleSuggestionClicked = (event: React.MouseEvent<HTMLElement>, value: string) => {
    const { updateMessage, composerMaxTextLength } = this.props
    this.setState({ suggestions: [] })
    const msg = value.slice(0, composerMaxTextLength)
    updateMessage(msg)
  }

  isLastMessageFromBot = (): boolean => {
    return this.props.currentConversation?.messages?.slice(-1)?.pop()?.authorId === undefined
  }

  onVoiceStart = () => {
    this.setState({ isRecording: true })
  }

  onVoiceEnd = async (voice: Buffer, ext: string) => {
    this.setState({ isRecording: false })

    await this.props.sendVoiceMessage(voice, ext)
  }

  onVoiceNotAvailable = () => {
    console.warn(
      'Voice input is not available on this browser. Please check https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder for compatibility'
    )
  }

  render() {
    if (this.props.composerHidden) {
      return null
    }

    let direction
    if (this.props.message) {
      direction = isRTLText.test(this.props.message) ? 'rtl' : 'ltr'
    }

    const placeholder =
      this.props.composerPlaceholder ||
      this.props.intl.formatMessage(
        {
          id: this.isLastMessageFromBot() ? 'composer.placeholder' : 'composer.placeholderInit'
        },
        { name: this.props.botName }
      )

    return (
      <>
        <SuggestionList
          isLoading={this.state.isLoading}
          suggestions={this.state.suggestions}
          onItemClick={this.handleSuggestionClicked}
        />
        <div role="region" className={classNames('bpw-composer', direction)}>
          <div className={'bpw-composer-inner'}>
            <div className={'bpw-composer-textarea'}>
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
                disabled={this.props.composerLocked}
              />
              <label htmlFor="input-message" style={{ display: 'none' }}>
                {placeholder}
              </label>
            </div>

            <div className={'bpw-send-buttons'}>
              <ToolTip
                childId="btn-send"
                content={
                  this.props.isEmulator
                    ? this.props.intl.formatMessage({
                        id: 'composer.interact',
                        defaultMessage: 'Interact with your chatbot'
                      })
                    : this.props.intl.formatMessage({
                        id: 'composer.sendMessage',
                        defaultMessage: 'Send Message'
                      })
                }
              >
                <button
                  className={'bpw-send-button'}
                  disabled={!this.props.message.length || this.props.composerLocked || this.state.isRecording}
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
              {this.props.enableVoiceComposer && (
                <VoiceRecorder
                  onStart={this.onVoiceStart}
                  onDone={this.onVoiceEnd}
                  onNotAvailable={this.onVoiceNotAvailable}
                />
              )}
            </div>
          </div>
        </div>
      </>
    )
  }
}

export default inject(({ store }: { store: RootStore }) => ({
  enableVoiceComposer: store.config.enableVoiceComposer,
  message: store.composer.message,
  composerLocked: store.composer.locked,
  composerHidden: store.composer.hidden,
  composerPlaceholder: store.composer.composerPlaceholder,
  composerMaxTextLength: store.composer.composerMaxTextLength,
  updateMessage: store.composer.updateMessage,
  recallHistory: store.composer.recallHistory,
  intl: store.intl,
  sendMessage: store.sendMessage,
  sendVoiceMessage: store.sendVoiceMessage,
  botName: store.botName,
  setFocus: store.view.setFocus,
  focusedArea: store.view.focusedArea,
  focusPrevious: store.view.focusPrevious,
  focusNext: store.view.focusNext,
  enableArrowNavigation: store.config.enableArrowNavigation,
  enableResetSessionShortcut: store.config.enableResetSessionShortcut,
  resetSession: store.resetSession,
  currentConversation: store.currentConversation,
  isEmulator: store.isEmulator,
  preferredLanguage: store.preferredLanguage
}))(injectIntl(observer(Composer)))

type ComposerProps = {
  focused: boolean
  composerPlaceholder: string
  composerLocked: boolean
  composerHidden: boolean
} & InjectedIntlProps &
  Pick<
    StoreDef,
    | 'botName'
    | 'composerPlaceholder'
    | 'intl'
    | 'focusedArea'
    | 'sendMessage'
    | 'sendVoiceMessage'
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
    | 'enableVoiceComposer'
    | 'currentConversation'
    | 'preferredLanguage'
    | 'composerMaxTextLength'
  >

interface StateProps {
  isRecording: boolean
  isLoading: boolean
  suggestions: string[]
}
