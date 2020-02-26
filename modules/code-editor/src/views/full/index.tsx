import { Container } from 'botpress/ui'
import { configure } from 'mobx'
import { Provider } from 'mobx-react'
import React from 'react'

import { RootStore } from './store'
import Editor from './Editor'
import SidePanel from './SidePanel'

configure({ enforceActions: 'observed' })

export default class CodeEditor extends React.Component<{ bp: any }> {
  private store: RootStore

  constructor(props) {
    super(props)
    this.store = new RootStore({ bp: this.props.bp })
  }

  componentDidMount() {
    // tslint:disable-next-line: no-floating-promises
    this.store.initialize()
  }

  render() {
    const keyMap = { newFile: 'ctrl+alt+n', rawFileMode: 'r a w t o o l', previewFlow: 'i a m a m a z i n g' }
    const keyHandlers = {
      newFile: this.store.createNewAction,
      rawFileMode: this.store.enableRawEditor,
      previewFlow: this.store.previewFlow
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
