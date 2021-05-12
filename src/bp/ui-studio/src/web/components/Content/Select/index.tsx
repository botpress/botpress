import axios from 'axios'
import { Dialog, lang } from 'botpress/shared'
import classnames from 'classnames'
import React, { Component } from 'react'
import { Alert, Button } from 'react-bootstrap'
import Markdown from 'react-markdown'
import { connect } from 'react-redux'
import { deleteMedia, fetchContentCategories, fetchContentItems, upsertContentItem } from '~/actions'
import Loading from '~/components/Util/Loading'
import { CONTENT_TYPES_MEDIA } from '~/util/ContentDeletion'

import withLanguage from '../../Util/withLanguage'
import CreateOrEditModal from '../CreateOrEditModal'

import style from './style.scss'

const SEARCH_RESULTS_LIMIT = 10

const formSteps = {
  INITIAL: 0,
  PICK_CATEGORY: 1,
  MAIN: 2
}

interface Props {
  fetchContentCategories: Function
  container: any
  deleteMedia: Function
  fetchContentItems: Function
  contentItems: any
  categories: any
  upsertContentItem: Function
  onSelect: any
  onClose: any
  contentType: any
  contentLang: any
}

interface State {
  activeItemIndex: any
  step: any
  newItemCategory: any
  searchTerm: any
  contentType: any
  newItemData: any
  show: boolean
  hideCategoryInfo: boolean
}

class SelectContent extends Component<Props, State> {
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
    this.props.fetchContentCategories()

    this.props.container.addEventListener('keyup', this.handleChangeActiveItem)
  }

  componentWillUnmount() {
    this.props.container.removeEventListener('keyup', this.handleChangeActiveItem)
  }

  UNSAFE_componentWillReceiveProps(newProps) {
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

  handleChangeActiveItem = e => {
    const index = this.state.activeItemIndex
    if (e.key === 'ArrowUp') {
      this.setState({ activeItemIndex: index > 0 ? index - 1 : index })
    } else if (e.key === 'ArrowDown') {
      const { contentItems } = this.props
      const itemsCount = contentItems?.length ?? 0
      this.setState({ activeItemIndex: index < itemsCount - 1 ? index + 1 : index })
    } else if (e.key === 'Enter' && this.state.step === formSteps.PICK_CATEGORY) {
      this.setCurrentCategory(this.props.categories.filter(cat => !cat.hidden)[this.state.activeItemIndex].id)
    } else if (e.key === 'Enter' && !this.state.newItemCategory) {
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
      .then(() => this.searchContentItems())
  }

  handlePick(item) {
    this.props.onSelect?.(item)
    this.onClose()
  }

  handleFormEdited = data => {
    this.setState({ newItemData: data })
  }

  resetCreateContent = (resetSearch = false) => response => {
    const { data: id } = response || {}

    if (!id && CONTENT_TYPES_MEDIA.includes(this.state.newItemCategory.id)) {
      this.props.deleteMedia(this.state.newItemData)
    }

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
          const { data: item } = await axios.get(`${window.STUDIO_API_PATH}/cms/element/${id}`)
          this.handlePick(item)
        }

        resolve()
      })
    )
  }

  onClose = () => {
    this.setState({ show: false }, () => {
      this.props.onClose?.()
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
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.searchContentItems().then(() => this.setState({ step: formSteps.MAIN }))
    })
  }

  renderCategoryPicker() {
    const { categories } = this.props
    return (
      <div>
        <strong>{lang.tr('studio.content.searchIn')}</strong>
        <div className="list-group">
          <a onClick={() => this.setCurrentCategory(null)} className="list-group-item list-group-item-action">
            {lang.tr('all')}
          </a>
          {categories
            .filter(cat => !cat.hidden)
            .map((category, i) => (
              <a
                key={i}
                onClick={() => this.setCurrentCategory(category.id)}
                className={classnames('list-group-item', 'list-group-item-action', {
                  active: i === this.state.activeItemIndex
                })}
              >
                {lang.tr(category.title)}
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
        {lang.tr('studio.content.currentlySearching')}: <strong>{lang.tr(title)}</strong>
        .&nbsp;
        <Button className="btn btn-warning btn-sm" onClick={this.resetCurrentCategory}>
          {lang.tr('change')}
        </Button>
      </p>
    )
  }

  getSearchDescription() {
    const { categories } = this.props
    const { contentType } = this.state
    const title = contentType ? categories.find(({ id }) => id === contentType).title : 'all content elements'
    return `${lang.tr('search')} ${lang.tr(title)} (${this.props.contentItems?.length})`
  }

  renderMainBody() {
    const categories = this.getVisibleCategories()

    if (!categories.length) {
      return (
        <Alert bsStyle="warning">
          <strong>We think you don&apos;t have any content types defined.</strong> Please&nbsp;
          <a href="https://botpress.com/docs/main/content" target="_blank" rel="noopener noreferrer">
            <strong>read the docs</strong>
          </a>
          &nbsp;to see how you can make use of this feature.
        </Alert>
      )
    }

    const renderContentItem = contentItem => {
      const preview = contentItem.previews[this.props.contentLang]
      if (preview && contentItem?.schema?.title === 'Image') {
        return (
          <Markdown
            source={`\\[${contentItem.contentType}\\] ${preview}`}
            renderers={{
              image: props => <img {...props} className={style.imagePreview} />,
              link: props => (
                <a href={props.href} target="_blank">
                  {props.children}
                </a>
              )
            }}
          />
        )
      } else {
        return `[${contentItem.contentType}] ${preview}`
      }
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
              key={i}
              onClick={() => this.setState({ newItemCategory: category, newItemData: null })}
              className={`list-group-item list-group-item-action ${style.createItem}`}
            >
              {lang.tr('studio.content.createNew', { title: lang.tr(category.title) })}
            </a>
          ))}
          {this.props.contentItems.map((contentItem, i) => (
            <a
              key={i}
              className={`list-group-item list-group-item-action ${i === this.state.activeItemIndex ? 'active' : ''}`}
              onClick={() => this.handlePick(contentItem)}
            >
              {renderContentItem(contentItem)}
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
      <Dialog.Wrapper title={lang.tr('studio.content.selectContent')} isOpen={show} onClose={this.onClose}>
        <Dialog.Body>{this.renderBody()}</Dialog.Body>
        <CreateOrEditModal
          show={!!newItemCategory}
          schema={schema.json}
          uiSchema={schema.ui}
          handleClose={this.resetCreateContent(false)}
          formData={this.state.newItemData}
          handleEdit={this.handleFormEdited}
          handleCreateOrUpdate={this.handleCreate}
        />
      </Dialog.Wrapper>
    )
  }
}

const mapStateToProps = state => ({
  contentItems: state.content.currentItems,
  categories: state.content.categories
})

const mapDispatchToProps = {
  deleteMedia,
  fetchContentItems,
  fetchContentCategories,
  upsertContentItem
}

export default connect(mapStateToProps, mapDispatchToProps)(withLanguage(SelectContent))
