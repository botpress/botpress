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

    const BeforeContainer = getOverridedComponent(this.props.config.overrides, 'before_container')
    const BelowConversation = getOverridedComponent(this.props.config.overrides, 'below_conversation')

    return (
      <React.Fragment>
        {BeforeContainer && <BeforeContainer {...this.props} />}
        <div className={classNames} style={{ width: this.props.dimensions.layout }}>
          <Header focused={this.props.isFocused('header')} />
          {this.renderBody()}
          {BelowConversation && <BelowConversation {...this.props} />}
        </div>
      </React.Fragment>
    )
  }
}

export default inject(({ store }: { store: RootStore }) => ({
  store,
  displayConvos: store.view.displayConvos,
  displayBotInfo: store.view.displayBotInfo,
  isFullscreen: store.view.isFullscreen,
  isFocused: store.view.isFocused,
  sideTransition: store.view.sideTransition,
  dimensions: store.view.dimensions,
  currentConversation: store.currentConversation,
  config: store.config,
  botName: store.botName
}))(injectIntl(observer(Container)))

type ContainerProps = InjectedIntlProps &
  Pick<
    StoreDef,
    | 'config'
    | 'botName'
    | 'isFocused'
    | 'displayConvos'
    | 'isFullscreen'
    | 'displayBotInfo'
    | 'sideTransition'
    | 'dimensions'
  >
