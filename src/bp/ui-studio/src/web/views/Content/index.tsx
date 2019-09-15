import Promise from 'bluebird'
import classnames from 'classnames'
import _ from 'lodash'
import React, { Component } from 'react'
import { Alert } from 'react-bootstrap'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { deleteContentItems, fetchContentCategories, fetchContentItems, upsertContentItem } from '~/actions'
import CreateOrEditModal from '~/components/Content/CreateOrEditModal'
import { operationAllowed } from '~/components/Layout/PermissionsChecker'
import { Container } from '~/components/Shared/Interface'
import DocumentationProvider from '~/components/Util/DocumentationProvider'
import { RootReducer } from '~/reducers'
import { UserReducer } from '~/reducers/user'

import style from './style.scss'
import List from './List'
import Sidebar from './SideBar'

class ContentView extends Component<Props, State> {
  private canRead = false
  private canEdit = false

  state = {
    searchQuery: null,
    showModal: false,
    modifyId: null,
    selectedId: 'all',
    contentToEdit: null
  }

  initialized = false

  init() {
    if (this.initialized || !this.props.user || this.props.user.email == null) {
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
      contentType: id,
      ...this.state.searchQuery
    })
  }

  currentContentType() {
    return this.state.modifyId
      ? _.get(_.find(this.props.contentItems, { id: this.state.modifyId }), 'contentType')
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
    const contentType = this.currentContentType()
    this.props
      .upsertContentItem({ contentType, formData: this.state.contentToEdit, modifyId: this.state.modifyId })
      .then(() => this.fetchCategoryItems(this.state.selectedId))
      .then(() => this.setState({ showModal: false }))
  }

  handleClone = ids => {
    return Promise.all(
      this.props.contentItems
        .filter(({ id }) => ids.includes(id))
        .map(({ contentType, formData }) => this.props.upsertContentItem({ formData, contentType }))
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

  handleSearch = input => {
    this.setState({ searchQuery: input })
    setImmediate(() => this.fetchCategoryItems(this.state.selectedId))
  }

  render() {
    const { selectedId = 'all', contentToEdit } = this.state
    const categories = this.props.categories || []
    const selectedCategory = _.find(categories, { id: this.currentContentType() })

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
      <Container>
        <Sidebar
          readOnly={!this.canEdit}
          categories={categories}
          selectedId={selectedId}
          handleAdd={this.handleCreateNew}
          handleCategorySelected={this.handleCategorySelected}
        />
        <List
          readOnly={!this.canEdit}
          count={
            this.state.selectedId === 'all'
              ? _.sumBy(categories, 'count') || 0
              : _.find(categories, { id: this.state.selectedId }).count
          }
          contentItems={this.props.contentItems || []}
          handleRefresh={this.handleRefresh}
          handleEdit={this.handleModalShowForEdit}
          handleDeleteSelected={this.handleDeleteSelected}
          handleClone={this.handleClone}
          handleSearch={this.handleSearch}
        />
        {this.canEdit && (
          <CreateOrEditModal
            show={this.state.showModal}
            schema={(selectedCategory && selectedCategory.schema.json) || {}}
            uiSchema={(selectedCategory && selectedCategory.schema.ui) || {}}
            formData={contentToEdit}
            isEditing={this.state.modifyId !== null}
            handleCreateOrUpdate={this.handleUpsert}
            handleEdit={this.handleFormEdited}
            handleClose={this.handleCloseModal}
          />
        )}
        <DocumentationProvider file="content" />
      </Container>
    )
  }
}

const mapStateToProps = (state: RootReducer) => ({
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

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ContentView)

type Props = {
  fetchContentCategories: Function
  fetchContentItems: Function
  upsertContentItem: Function
  deleteContentItems: Function
  categories: any
  contentItems: any
  user: UserReducer
} & RouteComponentProps

interface State {
  searchQuery: object
  showModal: boolean
  contentToEdit: object
  modifyId: string
  selectedId: string
}
