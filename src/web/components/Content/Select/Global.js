import React, { Component } from 'react'
import Select from './index'
import nanoId from 'nanoid'

class GobalSelectContent extends Component {
  state = {
    selects: []
  }

  constructor(props) {
    super(props)

    window.botpress = window.botpress || {}
    window.botpress.pickContent = ({ categoryId = null } = {}, callback) => {
      this.setState(({ selects }) => ({
        selects: [...selects, { categoryId, callback, id: nanoId() }]
      }))
    }
  }

  componentWillUnmount() {
    delete window.botpress.pickContent
  }

  onClose = i => () => {
    this.setState(({ selects }) => ({
      selects: selects.slice(0, i).concat(selects.slice(i + 1))
    }))
  }

  render() {
    return (
      <div>
        {this.state.selects.map(({ categoryId, callback, id }, i) => (
          <Select key={id} categoryId={categoryId} onSelect={callback} onClose={this.onClose(i)} />
        ))}
      </div>
    )
  }
}

export default GobalSelectContent
