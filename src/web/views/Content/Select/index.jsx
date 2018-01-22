import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Modal, Button, Radio, OverlayTrigger, Tooltip, Panel, Well, Alert } from 'react-bootstrap'
import Select from 'react-select'
import Promise from 'bluebird'
import axios from 'axios'
import classnames from 'classnames'

import Loading from '~/components/Util/Loading'
import CreateOrEditModal from '../modal'
import { fetchContentItemsRecent, fetchContentItemsCount, fetchContentCategories, upsertContentItem } from '~/actions'
import { moveCursorToEnd } from '~/util'

const style = require('./style.scss')

const SEARCH_RESULTS_LIMIT = 5

const formSteps = {
  INITIAL: 0,
  PICK_CATEGORY: 1,
  MAIN: 2
}

const initialData = {
  show: false,
  newItemCategory: null,
  searchTerm: '',
  newItemData: null,
  activeItemIndex: 0,
  categoryId: null,
  step: formSteps.INITIAL
}

class SelectContent extends Component {
  state = initialData

  constructor(props) {
    super(props)

    window.botpress = window.botpress || {}
    window.botpress.pickContent = (options = {}, callback) => {
      this.setState({ step: formSteps.INITIAL }, () => {
        this.searchContentItems()
        this.props.fetchContentItemsCount()
        this.props.fetchContentCategories()
        this.callback = callback
        this.setState({ show: true, activeItemIndex: 0 })
        setImmediate(() => moveCursorToEnd(this.searchInput))
      })

      window.addEventListener('keyup', this.handleChangeActiveItem)
    }
  }

  componentWillReceiveProps(newProps) {
    const { categories } = newProps
    if (!categories) {
      return
    }
    if (this.state.step !== formSteps.INITIAL) {
      return
    }
    this.setState({
      step: categories.length > 1 ? formSteps.PICK_CATEGORY : formSteps.MAIN
    })
  }

  componentWillUnmount() {
    delete window.botpress.pickContent
  }

  searchContentItems() {
    return this.props.fetchContentItemsRecent({
      count: SEARCH_RESULTS_LIMIT,
      searchTerm: this.state.searchTerm,
      categoryId: this.state.categoryId || 'all'
    })
  }

  handleChangeActiveItem = e => {
    const index = this.state.activeItemIndex
    if (e.key === 'ArrowUp') {
      this.setState({ activeItemIndex: index > 0 ? index - 1 : index })
    } else if (e.key === 'ArrowDown') {
      this.setState({ activeItemIndex: index < SEARCH_RESULTS_LIMIT - 1 ? index + 1 : index })
    } else if (e.key === 'Enter') {
      this.handlePick(this.props.contentItems[this.state.activeItemIndex])
    }
  }

  onSearchChange = event => {
    const newSearchTerm = event.target.value
    const { searchTerm } = this.state
    if (newSearchTerm === searchTerm) {
      return
    }
    this.setState({ searchTerm: newSearchTerm }, () => {
      this.searchContentItems().then(() => this.setState({ activeItemIndex: 0 }))
    })
  }

  handleCreate = () => {
    this.props
      .upsertContentItem({
        categoryId: this.state.newItemCategory.id,
        formData: this.state.newItemData
      })
      .then(this.resetCreateContent(true))
      .then(() => Promise.all([this.searchContentItems(), this.props.fetchContentItemsCount()]))
  }

  handlePick(item) {
    this.callback(item)
    this.onClose()
  }

  handleFormEdited = data => {
    this.setState({ newItemData: data })
  }

  resetCreateContent = (resetSearch = false) => () => {
    const state = { newItemCategory: null, newItemData: null }
    if (resetSearch) {
      state.searchTerm = ''
    }
    return new Promise(resolve => this.setState(state, resolve))
  }

  onClose = () => {
    this.setState(initialData)
    this.callback = null
    window.removeEventListener('keyup', this.handleChangeActiveItem)
  }

  getVisibleCategories() {
    const { categories } = this.props
    if (!categories) {
      return []
    }

    const { categoryId } = this.state
    return categoryId ? categories.filter(({ id }) => id === categoryId) : categories
  }

  setCurrentCategory(categoryId) {
    this.setState({ categoryId }, () => {
      this.searchContentItems().then(() => this.setState({ step: formSteps.MAIN }))
    })
  }

  renderCategoryPicker() {
    const { categories } = this.props
    return (
      <div>
        <strong>Search in:</strong>
        <div className="list-group">
          <a href="#" onClick={() => this.setCurrentCategory(null)} className="list-group-item list-group-item-action">
            All
          </a>
          {categories.map(category => (
            <a
              href="#"
              onClick={() => this.setCurrentCategory(category.id)}
              className="list-group-item list-group-item-action"
            >
              {category.title}
            </a>
          ))}
        </div>
      </div>
    )
  }

  resetCurrentCategory = () => {
    this.setState({ categoryId: null, step: formSteps.PICK_CATEGORY })
  }

  renderCurrentCategoryInfo() {
    const { categories } = this.props
    if (!categories || categories.length < 2) {
      return null
    }

    const { categoryId } = this.state
    const title = categoryId ? categories.find(({ id }) => id === categoryId).title : 'All'

    return (
      <p>
        Currently Searching in: <strong>{title}</strong>.&nbsp;
        <button className="btn btn-warning btn-sm" onClick={this.resetCurrentCategory}>
          Change
        </button>
      </p>
    )
  }

  renderMainBody() {
    const categories = this.getVisibleCategories()

    if (!categories.length) {
      return (
        <Alert bsStyle="warning">
          <strong>We think you don't have any content types defined.</strong> Please&nbsp;
          <a href="https://botpress.io/docs/foundamentals/content/" target="_blank">
            <strong>read the docs</strong>
          </a>
          &nbsp;to see how you can make use of this feature.
        </Alert>
      )
    }

    return (
      <div>
        {this.renderCurrentCategoryInfo()}
        <input
          type="text"
          className="form-control"
          placeholder={`Search all content elements (${this.props.itemsCount})`}
          aria-label="Search content elements"
          onChange={this.onSearchChange}
          ref={input => (this.searchInput = input)}
          value={this.state.searchTerm}
        />
        <hr />
        <div className="list-group">
          {categories.map(category => (
            <a
              href="#"
              onClick={() => this.setState({ newItemCategory: category, newItemData: {} })}
              className={`list-group-item list-group-item-action ${style.createItem}`}
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
      </div>
    )
  }

  renderBody() {
    if (this.state.step === formSteps.INITIAL) {
      return <Loading />
    } else if (this.state.step === formSteps.PICK_CATEGORY) {
      return this.renderCategoryPicker()
    }
    return this.renderMainBody()
  }

  render() {
    const schema = (this.state.newItemCategory || {}).schema || { json: {}, ui: {} }

    return (
      <Modal animation={false} show={this.state.show} onHide={this.onClose} container={document.getElementById('app')}>
        <Modal.Header closeButton>
          <Modal.Title>Pick Content</Modal.Title>
        </Modal.Header>
        <Modal.Body>{this.renderBody()}</Modal.Body>

        <CreateOrEditModal
          show={this.state.newItemData}
          schema={schema.json}
          uiSchema={schema.ui}
          handleClose={this.resetCreateContent(false)}
          formData={this.state.newItemData}
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
  upsertContentItem
}

export default connect(mapStateToProps, mapDispatchToProps)(SelectContent)
