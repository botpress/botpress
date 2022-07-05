import { Keyboard } from '@botpress/messaging-components'
import classnames from 'classnames'
import { inject, observer } from 'mobx-react'
import React from 'react'
import { InjectedIntlProps, injectIntl } from 'react-intl'

import { RootStore, StoreDef } from '../store'

import BotInfo from './common/BotInfo'
import Composer from './Composer'
import ConversationList from './ConversationList'
import Footer from './Footer'
import Header from './Header'
import MessageList from './messages/MessageList'

class Container extends React.Component<ContainerProps, ContainerState> {
  renderBody() {
    if (!this.props.isInitialized) {
      return (
        <div className="bpw-msg-list-container bpw-msg-list-container-loading">
          <div className="bpw-msg-list-loading" />
        </div>
      )
    }

    if (this.props.isConversationsDisplayed) {
      return <ConversationList />
    } else if (this.props.isBotInfoDisplayed) {
      return <BotInfo />
    } else {
      return (
        <div
          className={classnames('bpw-msg-list-container', {
            'bpw-emulator': this.props.isEmulator,
            'bpw-rtl': this.props.rtl
          })}
        >
          <MessageList />
          <Keyboard>
            <Composer />
          </Keyboard>
        </div>
      )
    }
  }

  render() {
    const classNames = classnames('bpw-layout', 'bpw-chat-container', {
      'bpw-layout-fullscreen': this.props.isFullscreen && 'fullscreen',
      [`bpw-anim-${this.props.sideTransition}`]: true
    })

    return (
      <React.Fragment>
        <div className={classNames} style={{ width: this.props.dimensions.layout }}>
          <Header />
          {this.renderBody()}
          {this.props.isPoweredByDisplayed && <Footer />}
        </div>
      </React.Fragment>
    )
  }
}

export default inject(({ store }: { store: RootStore }) => ({
  store,
  isConversationsDisplayed: store.view.isConversationsDisplayed,
  isBotInfoDisplayed: store.view.isBotInfoDisplayed,
  isFullscreen: store.view.isFullscreen,
  sideTransition: store.view.sideTransition,
  dimensions: store.view.dimensions,
  isEmulator: store.isEmulator,
  isInitialized: store.isInitialized,
  isPoweredByDisplayed: store.view.isPoweredByDisplayed,
  config: store.config,
  botName: store.botName,
  rtl: store.rtl
}))(injectIntl(observer(Container)))

type ContainerProps = { store?: RootStore } & InjectedIntlProps &
  Pick<
    StoreDef,
    | 'config'
    | 'botName'
    | 'isFullscreen'
    | 'isConversationsDisplayed'
    | 'isBotInfoDisplayed'
    | 'sideTransition'
    | 'isInitialized'
    | 'dimensions'
    | 'isEmulator'
    | 'isPoweredByDisplayed'
    | 'rtl'
  >

interface ContainerState {
  isKeyboardRendered: boolean
}
