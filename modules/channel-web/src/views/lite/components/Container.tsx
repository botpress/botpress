import classnames from 'classnames'
import { inject, observer } from 'mobx-react'
import React from 'react'
import { InjectedIntlProps, injectIntl } from 'react-intl'

import { RootStore, StoreDef } from '../store'

import BotInfo from './common/BotInfo'
import MessageList from './messages/MessageList'
import Composer from './Composer'
import ConversationList from './ConversationList'
import Footer from './Footer'
import Header from './Header'
import * as Keyboard from './Keyboard'
import OverridableComponent from './OverridableComponent'

class Container extends React.Component<ContainerProps> {
  renderBody() {
    if (this.props.isConversationsDisplayed) {
      return <ConversationList />
    } else if (this.props.isBotInfoDisplayed) {
      return <BotInfo />
    } else {
      return (
        <div className={'bpw-msg-list-container'}>
          <MessageList />
          <Keyboard.Default>
            <OverridableComponent name={'composer'} original={Composer} />
          </Keyboard.Default>
        </div>
      )
    }
  }

  render() {
    const classNames = classnames('bpw-layout', 'bpw-chat-container', {
      'bpw-layout-fullscreen': this.props.isFullscreen && 'fullscreen',
      ['bpw-anim-' + this.props.sideTransition]: true
    })

    return (
      <React.Fragment>
        <OverridableComponent name={'before_container'} original={null} />
        <div className={classNames} style={{ width: this.props.dimensions.layout }}>
          <Header />
          {this.renderBody()}
          <OverridableComponent name={'below_conversation'} original={null} />
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
  isPoweredByDisplayed: store.view.isPoweredByDisplayed,
  config: store.config,
  botName: store.botName
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
    | 'dimensions'
    | 'isPoweredByDisplayed'
  >
