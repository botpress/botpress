import React, { Component } from 'react'
import Select from './index'
import nanoId from 'nanoid'

class SelectContentManager extends Component {
  state = {
    selects: []
  }

  constructor(props) {
    super(props)

    window.botpress = window.botpress || {}
    window.botpress.pickContent = ({ categoryId = null } = {}, callback) => {
      const id = nanoId()
      const rootEl = document.createElement('DIV')
      rootEl.setAttribute('data-select-content-container', id)
      document.getElementById('app').appendChild(rootEl)
      this.setState(({ selects }) => ({
        selects: [...selects, { categoryId, callback, id, rootEl }]
      }))
    }
  }

  componentWillUnmount() {
    delete window.botpress.pickContent
  }

  onClose = i => () => {
    const { rootEl } = this.state.selects[i]
    this.setState(
      ({ selects }) => ({
        selects: selects.slice(0, i).concat(selects.slice(i + 1))
      }),
      () => {
        if (rootEl.parentNode) {
          rootEl.parentNode.removeChild(rootEl)
        }
      }
    )
  }

  render() {
    const { selects } = this.state
    return (
      <div>
        {selects.map(({ categoryId, callback, id, rootEl }, i) => (
          <Select key={id} categoryId={categoryId} onSelect={callback} onClose={this.onClose(i)} container={rootEl} />
        ))}
      </div>
    )
  }
}

export default SelectContentManager
