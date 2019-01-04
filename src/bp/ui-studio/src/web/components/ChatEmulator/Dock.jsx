import React from 'react'
import Dock from 'react-dock'
import { HotKeys } from 'react-hotkeys'
import Emulator from './Emulator'
import { keyMap } from '~/keyboardShortcuts'

import DocumentationProvider from '~/components/Util/DocumentationProvider'

import style from './Dock.styl'

export default class EmulatorDock extends React.Component {
  state = {
    size: 650
  }

  handleSizeChange = e => this.setState({ size: Math.min(Math.max(100, e), 1000) }) // [100, 1000] px

  keyHandlers = {
    cancel: () => this.props.isOpen && this.props.onToggle()
  }

  render() {
    return (
      <Dock
        position="right"
        isVisible={this.props.isOpen}
        fluid={false}
        zIndex={5}
        dimMode="none"
        duration={0}
        size={this.state.size}
        dockStyle={{ transition: 'none' }}
        onSizeChange={this.handleSizeChange}
      >
        <HotKeys keyMap={keyMap} handlers={this.keyHandlers}>
          <div className={style.container} tabIndex={-1}>
            <div className={style.titleBar} onClick={this.props.onToggle}>
              Chat Emulator
            </div>
            {this.props.isOpen && <DocumentationProvider file="debug" />}
            <Emulator isDockOpen={this.props.isOpen} />
          </div>
        </HotKeys>
      </Dock>
    )
  }
}
