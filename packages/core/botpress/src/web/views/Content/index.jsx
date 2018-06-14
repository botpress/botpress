import React, { Component } from 'react'
import { connect } from 'react-redux'
import classnames from 'classnames'
import Promise from 'bluebird'
import _ from 'lodash'

import { Grid, Row, Col, Alert } from 'react-bootstrap'

import Sidebar from './Sidebar'
import { fetchContentCategories, fetchContentItems, upsertContentItem, deleteContentItems } from '~/actions'

import List from './List'
import CreateOrEditModal from '~/components/Content/CreateOrEditModal'

import ContentWrapper from '~/components/Layout/ContentWrapper'
import PageHeader from '~/components/Layout/PageHeader'
import { operationAllowed } from '~/components/Layout/PermissionsChecker'

const style = require('./style.scss')
const ITEMS_PER_PAGE = 20

class ContentView extends Component {
  state = {
    showModal: false,
    modifyId: null,
    selectedId: 'all',
    page: 1,
    contentToEdit: null
  }

  initialized = false

  init() {
    if (this.initialized || !this.props.user || this.props.user.id == null) {
      return
    }
    this.initialized = true
    this.canRead = operationAllowed({ user: this.props.user, op: 'read', res: 'bot.content' })
    this.canEdit = operationAllowed({ user: this.props.user, op: 'write', res: 'bot.content' })

    if (this.canRead) {
      this.props.fetchContentCategories()
      this.fetchCategoryItems(this.state.selectedId)
    }
  }

  componentDidMount() {
    this.init()
  }

  componentDidUpdate() {
    this.init()
  }

  fetchCategoryItems(id) {
    if (!this.canRead) {
      return Promise.resolve()
    }
    return this.props.fetchContentItems({
      id,
      count: ITEMS_PER_PAGE,
      from: (this.state.page - 1) * ITEMS_PER_PAGE,
      searchTerm: this.state.searchTerm
    })
  }

  currentCategoryId() {
    return this.state.modifyId
      ? _.find(this.props.contentItems, { id: this.state.modifyId }).categoryId
      : this.state.selectedId
  }

  handleCloseModal = () => {
    this.setState({
      showModal: false,
      modifyId: null,
      contentToEdit: null
    })
  }

  handleCreateNew = () => {
    this.setState({
      showModal: true,
      modifyId: null,
      contentToEdit: null
    })
  }

  handleUpsert = () => {
    const categoryId = this.currentCategoryId()
    this.props
      .upsertContentItem({ categoryId, formData: this.state.contentToEdit, modifyId: this.state.modifyId })
      .then(() => this.fetchCategoryItems(this.state.selectedId))
      .then(() => this.setState({ showModal: false }))
  }

  handleClone = ids => {
    return Promise.all(
      this.props.contentItems
        .filter(({ id }) => ids.includes(id))
        .map(({ categoryId, formData }) => this.props.upsertContentItem({ formData, categoryId }))
    ).then(() => this.fetchCategoryItems(this.state.selectedId))
  }

  handleFormEdited = data => {
    this.setState({ contentToEdit: data })
  }

  handleCategorySelected = id => {
    this.fetchCategoryItems(id)
    this.setState({ selectedId: id })
  }

  handleDeleteSelected = ids => {
    this.props.deleteContentItems(ids).then(() => this.fetchCategoryItems(this.state.selectedId))
  }

  handleModalShowForEdit = id => {
    const contentToEdit = _.find(this.props.contentItems, { id }).formData
    this.setState({ modifyId: id, showModal: true, contentToEdit })
  }

  handleRefresh = () => {
    this.fetchCategoryItems(this.state.selectedId || 'all')
  }

  handlePrevious = () => {
    this.setState({ page: this.state.page - 1 || 1 })
    setImmediate(() => this.fetchCategoryItems(this.state.selectedId))
  }

  handleNext = () => {
    this.setState({ page: this.state.page + 1 })
    setImmediate(() => this.fetchCategoryItems(this.state.selectedId))
  }

  handleSearch = input => {
    this.setState({ searchTerm: input })
    setImmediate(() => this.fetchCategoryItems(this.state.selectedId))
  }

  renderBody() {
    const { selectedId = 'all', contentToEdit } = this.state
    const categories = this.props.categories || []
    const selectedCategory = _.find(categories, { id: this.currentCategoryId() })

    const classNames = classnames(style.content, 'bp-content')

    if (!categories.length) {
      return (
        <div className={classNames}>
          <Alert bsStyle="warning">
            <strong>We think you don&apos;t have any content types defined.</strong> Please&nbsp;
            <a href="https://botpress.io/docs/foundamentals/content/" target="_blank" rel="noopener noreferrer">
              <strong>read the docs</strong>
            </a>
            &nbsp;to see how you can make use of this feature.
          </Alert>
        </div>
      )
    }

    return (
      <div>
        <Grid className={classNames}>
          <Row>
            <Col xs={3}>
              <Sidebar
                readOnly={!this.canEdit}
                categories={categories}
                selectedId={selectedId}
                handleAdd={this.handleCreateNew}
                handleCategorySelected={this.handleCategorySelected}
              />
            </Col>
            <Col xs={9}>
              <List
                readOnly={!this.canEdit}
                page={this.state.page}
                count={
                  this.state.selectedId === 'all'
                    ? _.sumBy(categories, 'count') || 0
                    : _.find(categories, { id: this.state.selectedId }).count
                }
                itemsPerPage={ITEMS_PER_PAGE}
                contentItems={this.props.contentItems || []}
                searchTerm={this.state.searchTerm}
                handlePrevious={this.handlePrevious}
                handleNext={this.handleNext}
                handleRefresh={this.handleRefresh}
                handleEdit={this.handleModalShowForEdit}
                handleDeleteSelected={this.handleDeleteSelected}
                handleClone={this.handleClone}
                handleSearch={this.handleSearch}
              />
            </Col>
          </Row>
        </Grid>
        {this.canEdit && (
          <CreateOrEditModal
            show={this.state.showModal}
            schema={(selectedCategory && selectedCategory.schema.json) || {}}
            uiSchema={(selectedCategory && selectedCategory.schema.ui) || {}}
            formData={contentToEdit}
            handleCreateOrUpdate={this.handleUpsert}
            handleEdit={this.handleFormEdited}
            handleClose={this.handleCloseModal}
          />
        )}
      </div>
    )
  }

  render() {
    return (
      <ContentWrapper>
        <PageHeader>Content Manager</PageHeader>
        {this.renderBody()}
      </ContentWrapper>
    )
  }
}

const mapStateToProps = state => ({
  categories: state.content.categories,
  contentItems: state.content.currentItems,
  user: state.user
})

const mapDispatchToProps = {
  fetchContentCategories,
  fetchContentItems,
  upsertContentItem,
  deleteContentItems
}

export default connect(mapStateToProps, mapDispatchToProps)(ContentView)
