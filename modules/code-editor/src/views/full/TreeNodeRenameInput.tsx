import { ITreeNode } from '@blueprintjs/core'
import React from 'react'

interface Props {
  nodeDomElement: HTMLElement
  node: ITreeNode
  handleCloseComponent: (newName: string, cancel: boolean) => Promise<void>
}

interface State {
  newName: string
}

interface Preventable {
  preventDefault: () => void
}

const FILENAME_REGEX = /[^0-9a-zA-Z_\-.]/

export class TreeNodeRenameInput extends React.Component<Props, State> {
  state = {
    newName: ''
  }

  componentDidMount() {
    this.setState({ newName: this.props.node.label as string })
  }

  closeRename = async (e: Preventable, cancel: boolean) => {
    e.preventDefault()
    let newName = this.state.newName
    newName = newName.endsWith('.js') ? newName : newName + '.js'
    this.setState({ newName })
    await this.props.handleCloseComponent(newName, cancel)
  }

  handleKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      await this.closeRename(e, false)
      return
    }
    if (e.key === 'Escape') {
      await this.closeRename(e, true)
      return
    }
  }

  focusRef = ref => {
    if (ref) {
      setTimeout(() => {
        ref.focus()
        ref.select()
      })
    }
  }

  onValueChange = e => {
    this.setState({ newName: e.target.value.replace(FILENAME_REGEX, '') })
  }

  render() {
    return (
      <div className={this.props.nodeDomElement && this.props.nodeDomElement.className}>
        <input
          onBlur={e => this.closeRename(e, false)}
          onKeyDown={this.handleKeyPress}
          ref={this.focusRef}
          type="text"
          className="bp3-input bp3-small"
          value={this.state.newName}
          onChange={this.onValueChange}
        />
      </div>
    )
  }
}
