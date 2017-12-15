import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Modal, Button, Radio, OverlayTrigger, Tooltip, Panel, Well } from 'react-bootstrap'
import Select from 'react-select'
import axios from 'axios'
import classnames from 'classnames'

import CreateOrEditModal from '../modal'
import { fetchContentItemsRecent, fetchContentItemsCount, fetchContentCategories, upsertContentItems } from '~/actions'

const style = require('./style.scss')

class SelectContent extends Component {
  constructor(props) {
    super(props)

    this.state = { show: false, category: null, searchTerm: '', contentToEdit: null, activeItemIndex: 0 }

    window.botpress = window.botpress || {}
    window.botpress.pickContent = (options = {}, callback) => {
      this.props.fetchContentItemsRecent({})
      this.props.fetchContentItemsCount()
      this.props.fetchContentCategories()
      this.setState({ show: true })
      this.callback = callback
      this.setState({ activeItemIndex: 0 })
      setImmediate(() => this.searchInput && this.searchInput.focus())

      window.onkeyup = this.handleChangeActiveItem
    }
  }

  componentWillUnmount() {
    delete window.botpress.pickContent
  }

  handleChangeActiveItem = e => {
    const index = this.state.activeItemIndex
    if (e.key === 'ArrowUp') {
      this.setState({ activeItemIndex: index > 0 ? index - 1 : index })
    } else if (e.key === 'ArrowDown') {
      this.setState({ activeItemIndex: index < 4 ? index + 1 : index })
    } else if (e.key === 'Enter') {
      this.handlePick(this.props.contentItems[this.state.activeItemIndex])
    }
  }

  search = event => {
    if (['ArrowUp', 'ArrowDown'].includes(event.key)) {
      return
    }

    this.setState({ searchTerm: event.target.value })
    this.props
      .fetchContentItemsRecent({ searchTerm: event.target.value })
      .then(() => this.setState({ activeItemIndex: 0 }))
  }

  handleCreate = () => {
    this.props
      .upsertContentItems({ categoryId: this.state.category.id, formData: this.state.contentToEdit })
      .then(() =>
        Promise.all([
          this.props.fetchContentItemsRecent({ searchTerm: this.state.searchTerm }),
          this.props.fetchContentItemsCount()
        ])
      )
      .then(() => this.setState({ category: null, contentToEdit: null }))
  }

  handlePick(item) {
    this.setState({ show: false })
    this.callback(item)
    window.onkeyup = null
  }

  handleFormEdited = data => {
    this.setState({ contentToEdit: data })
  }

  onClose = () => {
    this.setState({ show: false })
    window.onkeyup = null
  }

  render() {
    const schema = (this.state.category || {}).schema || { json: {}, ui: {} }

    return (
      <Modal animation={false} show={this.state.show} onHide={this.onClose} container={document.getElementById('app')}>
        <Modal.Header closeButton>
          <Modal.Title>Pick Content</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <input
            type="text"
            className="form-control"
            placeholder={`Search all content elements (${this.props.itemsCount})`}
            aria-label="Search content elements"
            onKeyUp={this.search}
            ref={input => (this.searchInput = input)}
          />
          <hr />
          <div className="list-group">
            {this.props.categories.map(category => (
              <a
                href="#"
                onClick={() => this.setState({ category, contentToEdit: {} })}
                className={`list-group-item list-group-item-action ${classnames(style.createItem)}`}
              >
                Create new {category.title}
              </a>
            ))}
            {this.props.contentItems.map((contentItem, i) => (
              <a
                href="#"
                className={`list-group-item list-group-item-action ${i === this.state.activeItemIndex ? 'active' : ''}`}
                onClick={() => this.handlePick(contentItem)}
              >
                {`[${contentItem.categoryId}] ${contentItem.previewText}`}
              </a>
            ))}
          </div>
        </Modal.Body>

        <CreateOrEditModal
          show={Boolean(this.state.category)}
          schema={schema.json}
          uiSchema={schema.ui}
          handleClose={() => this.setState({ category: null })}
          formData={this.state.contentToEdit}
          handleEdit={this.handleFormEdited}
          handleCreateOrUpdate={this.handleCreate}
        />
      </Modal>
    )
  }
}

const mapStateToProps = state => ({
  contentItems: state.content.recentItems,
  itemsCount: state.content.itemsCount,
  categories: state.content.categories
})

const mapDispatchToProps = {
  fetchContentItemsRecent,
  fetchContentItemsCount,
  fetchContentCategories,
  upsertContentItems
}

export default connect(mapStateToProps, mapDispatchToProps)(SelectContent)
