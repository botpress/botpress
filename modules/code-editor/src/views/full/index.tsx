import { ModuleUI } from 'botpress/shared'
import { configure } from 'mobx'
import { Provider } from 'mobx-react'
import React from 'react'

import Editor from './Editor'
import SidePanel from './SidePanel'
import { RootStore } from './store'
import { ActionPosition } from './typings'

configure({ enforceActions: 'observed' })
const { Container } = ModuleUI

export default class CodeEditor extends React.Component<{ bp: any }> {
  private readonly store: RootStore

  constructor(props) {
    super(props)
    this.store = new RootStore({ bp: this.props.bp })
  }

  componentDidMount() {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.store.initialize()
  }

  render() {
    const keyMap = {
      newFile: 'ctrl+alt+n',
      cmdDown: { sequence: 'command', action: 'keydown' },
      ctrlDown: { sequence: 'ctrl', action: 'keydown' },
      cmdUp: { sequence: 'command', action: 'keyup' },
      ctrlUp: { sequence: 'ctrl', action: 'keyup' },
    }

    const keyHandlers = {
      newFile: this.store.createNewAction,
      cmdDown: () => this.store.updateKeyActionState(ActionPosition.DOWN),
      ctrlDown: () => this.store.updateKeyActionState(ActionPosition.DOWN),
      cmdUp: () =>this.store.updateKeyActionState(ActionPosition.UP),
      ctrlUp: () => this.store.updateKeyActionState(ActionPosition.UP),
    }

    return (
      <Provider store={this.store}>
        <Container keyHandlers={keyHandlers} keyMap={keyMap}>
          <SidePanel />
          <Editor />
        </Container>
      </Provider>
    )
  }
}
