import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Modal, Button, Alert } from 'react-bootstrap'
import Promise from 'bluebird'
import classnames from 'classnames'

import Loading from '~/components/Util/Loading'
import CreateOrEditModal from '../CreateOrEditModal'
import { fetchContentItems, fetchContentItemsCount, fetchContentCategories, upsertContentItem } from '~/actions'
import axios from 'axios'
import withLanguage from '../../Util/withLanguage'

const style = require('./style.scss')

const SEARCH_RESULTS_LIMIT = 10

const formSteps = {
  INITIAL: 0,
  PICK_CATEGORY: 1,
  MAIN: 2
}

class SelectContent extends Component {
  constructor(props) {
    super(props)

    const { contentType = null } = props

    this.state = {
      show: true,
      contentType,
      hideCategoryInfo: !!contentType,
      activeItemIndex: 0,
      step: contentType ? formSteps.MAIN : formSteps.INITIAL,
      newItemCategory: null,
      searchTerm: '',
      newItemData: null
    }
  }

  componentDidMount() {
    this.searchContentItems()
    this.fetchContentItemsCount()
    this.props.fetchContentCategories()

    this.props.container.addEventListener('keyup', this.handleChangeActiveItem)
  }

  componentWillReceiveProps(newProps) {
    const { categories } = newProps
    if (!categories || this.state.step !== formSteps.INITIAL || this.state.contentType) {
      return
    }

    this.setState({
      step: categories.length > 1 ? formSteps.PICK_CATEGORY : formSteps.MAIN
    })
  }

  searchContentItems() {
    return this.props.fetchContentItems({
      count: SEARCH_RESULTS_LIMIT,
      searchTerm: this.state.searchTerm,
      contentType: this.state.contentType || 'all',
      sortOrder: [{ column: 'createdOn', desc: true }]
    })
  }

  fetchContentItemsCount() {
    return this.props.fetchContentItemsCount(this.state.contentType)
  }

  handleChangeActiveItem = e => {
    const index = this.state.activeItemIndex
    if (e.key === 'ArrowUp') {
      this.setState({ activeItemIndex: index > 0 ? index - 1 : index })
    } else if (e.key === 'ArrowDown') {
      const { contentItems } = this.props
      const itemsCount = contentItems ? contentItems.length : 0
      this.setState({ activeItemIndex: index < itemsCount - 1 ? index + 1 : index })
    } else if (e.key === 'Enter' && this.state.step === formSteps.PICK_CATEGORY) {
      this.setCurrentCategory(this.props.categories[this.state.activeItemIndex].id)
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
        contentType: this.state.newItemCategory.id,
        formData: this.state.newItemData
      })
      .then(this.resetCreateContent(true))
      .then(() => Promise.all([this.searchContentItems(), this.fetchContentItemsCount()]))
  }

  handlePick(item) {
    this.props.onSelect && this.props.onSelect(item)
    this.onClose()
  }

  handleFormEdited = data => {
    this.setState({ newItemData: data })
  }

  resetCreateContent = (resetSearch = false) => response => {
    const { data: id } = response || {}
    const stateUpdate = { newItemCategory: null, newItemData: null }
    if (resetSearch) {
      Object.assign(stateUpdate, {
        searchTerm: '',
        activeItemIndex: 0
      })
    }
    return new Promise(resolve =>
      this.setState(stateUpdate, async () => {
        if (id) {
          const { data: item } = await axios.get(`${window.BOT_API_PATH}/content/element/${id}`)
          this.handlePick(item)
        }

        resolve()
      })
    )
  }

  onClose = () => {
    this.setState({ show: false }, () => {
      this.props.onClose && this.props.onClose()
    })
  }

  getVisibleCategories() {
    const { categories } = this.props
    if (!categories) {
      return []
    }

    const { contentType } = this.state
    return contentType ? categories.filter(({ id }) => id === contentType) : categories.filter(cat => !cat.hidden)
  }

  setCurrentCategory(contentType) {
    this.setState({ contentType }, () => {
      Promise.all([this.searchContentItems(), this.fetchContentItemsCount()]).then(() =>
        this.setState({ step: formSteps.MAIN })
      )
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
          {categories.filter(cat => !cat.hidden).map((category, i) => (
            <a
              href="#"
              key={i}
              onClick={() => this.setCurrentCategory(category.id)}
              className={classnames('list-group-item', 'list-group-item-action', {
                active: i === this.state.activeItemIndex
              })}
            >
              {category.title}
            </a>
          ))}
        </div>
      </div>
    )
  }

  resetCurrentCategory = () => {
    this.setState({ contentType: null, step: formSteps.PICK_CATEGORY })
  }

  renderCurrentCategoryInfo() {
    const { categories } = this.props
    const { hideCategoryInfo } = this.state
    if (hideCategoryInfo || !categories || categories.length < 2) {
      return null
    }

    const { contentType } = this.state
    const title = contentType ? categories.find(({ id }) => id === contentType).title : 'All'

    return (
      <p>
        Currently Searching in: <strong>{title}</strong>
        .&nbsp;
        <Button className="btn btn-warning btn-sm" onClick={this.resetCurrentCategory}>
          Change
        </Button>
      </p>
    )
  }

  getSearchDescription() {
    const { categories } = this.props
    const { contentType } = this.state
    const title = contentType ? categories.find(({ id }) => id === contentType).title : 'all content elements'
    return `Search ${title} (${this.props.itemsCount})`
  }

  renderMainBody() {
    const categories = this.getVisibleCategories()

    if (!categories.length) {
      return (
        <Alert bsStyle="warning">
          <strong>We think you don&apos;t have any content types defined.</strong> Please&nbsp;
          <a href="https://botpress.io/docs/foundamentals/content/" target="_blank" rel="noopener noreferrer">
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
          placeholder={this.getSearchDescription()}
          aria-label="Search content elements"
          onChange={this.onSearchChange}
          autoFocus
          value={this.state.searchTerm}
        />
        <hr />
        <div className="list-group">
          {categories.map((category, i) => (
            <a
              href="#"
              key={i}
              onClick={() => this.setState({ newItemCategory: category, newItemData: null })}
              className={`list-group-item list-group-item-action ${style.createItem}`}
            >
              Create new {category.title}
            </a>
          ))}
          {this.props.contentItems.map((contentItem, i) => (
            <a
              href="#"
              key={i}
              className={`list-group-item list-group-item-action ${i === this.state.activeItemIndex ? 'active' : ''}`}
              onClick={() => this.handlePick(contentItem)}
            >
              {`[${contentItem.contentType}] ${contentItem.previews[this.props.contentLang]}`}
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
    const {
      state: { newItemCategory, show },
      props: { container }
    } = this
    const schema = (newItemCategory || {}).schema || { json: {}, ui: {} }

    return (
      <Modal
        animation={false}
        show={show}
        onHide={this.onClose}
        container={container}
        style={{ zIndex: 1051 }}
        backdrop={'static'}
      >
        <Modal.Header closeButton>
          <Modal.Title>Pick Content</Modal.Title>
        </Modal.Header>
        <Modal.Body>{this.renderBody()}</Modal.Body>

        <CreateOrEditModal
          show={!!newItemCategory}
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
  contentItems: state.content.currentItems,
  itemsCount: state.content.itemsCount,
  categories: state.content.categories
})

const mapDispatchToProps = {
  fetchContentItems,
  fetchContentItemsCount,
  fetchContentCategories,
  upsertContentItem
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withLanguage(SelectContent))
