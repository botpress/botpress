import classnames from 'classnames'
import { inject, observer } from 'mobx-react'
import React from 'react'
import { InjectedIntlProps, injectIntl } from 'react-intl'

import { RootStore, StoreDef } from '../store'
import { getOverridedComponent } from '../utils'

import BotInfo from './common/BotInfo'
import MessageList from './messages/MessageList'
import Composer from './Composer'
import ConversationList from './ConversationList'
import Header from './Header'
import * as Keyboard from './Keyboard'

class Container extends React.Component<ContainerProps> {
  renderComposer() {
    const Component = getOverridedComponent(this.props.config.overrides, 'composer')
    if (Component) {
      return (
        <Keyboard.Default>
          <Component original={{ Composer }} name={this.props.botName} {...this.props} />
        </Keyboard.Default>
      )
    }

    return (
      <Keyboard.Default>
        <Composer
          placeholder={this.props.intl.formatMessage({ id: 'composer.placeholder' }, { name: this.props.botName })}
          focused={this.props.isFocused('input')}
        />
      </Keyboard.Default>
    )
  }

  renderBody() {
    if (this.props.displayConvos) {
      return <ConversationList />
    } else if (this.props.displayBotInfo) {
      return <BotInfo />
    } else {
      return (
        <div className={'bpw-msg-list-container'}>
          <MessageList focused={this.props.isFocused('convo')} />
          {this.renderComposer()}
        </div>
      )
    }
  }

  render() {
    const classNames = classnames('bpw-layout', 'bpw-chat-container', {
      'bpw-layout-fullscreen': this.props.isFullscreen && 'fullscreen',
      ['bpw-anim-' + this.props.sideTransition]: true
    })

    const CustomComponent = getOverridedComponent(this.props.config.overrides, 'below_conversation')

    return (
      <span>
        <div className={classNames}>
          <Header focused={this.props.isFocused('header')} />
          {this.renderBody()}
          {CustomComponent && <CustomComponent {...this.props} />}
        </div>
      </span>
    )
  }
}

export default inject(({ store }: { store: RootStore }) => ({
  displayConvos: store.view.displayConvos,
  displayBotInfo: store.view.displayBotInfo,
  isFullscreen: store.view.isFullscreen,
  isFocused: store.view.isFocused,
  sideTransition: store.view.sideTransition,
  currentConversation: store.currentConversation,
  config: store.config,
  botName: store.botName
}))(injectIntl(observer(Container)))

type ContainerProps = InjectedIntlProps &
  Pick<
    StoreDef,
    'config' | 'botName' | 'isFocused' | 'displayConvos' | 'isFullscreen' | 'displayBotInfo' | 'sideTransition'
  >
