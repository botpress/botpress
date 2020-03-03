import { Button, ControlGroup, Intent } from '@blueprintjs/core'
import { confirmDialog } from 'botpress/shared'
import { Container } from 'botpress/ui'
import { AccessControl, getFlowLabel, reorderFlows } from 'botpress/utils'
import classnames from 'classnames'
import React, { Component } from 'react'
import { ButtonToolbar, FormControl, FormGroup, Pagination, Panel } from 'react-bootstrap'
import Select from 'react-select'

import './button.css'
import style from './style.scss'
import EditorModal from './Editor/EditorModal'
import { ExportButton } from './ExportButton'
import { ImportModal } from './ImportModal'
import Item from './Item'

export { LiteEditor } from './LiteEditor'

const ITEMS_PER_PAGE = 5
const QNA_PARAM_NAME = 'id'

interface Props {
  contentLang: string
  bp: any
}

export default class QnaAdmin extends Component<Props> {
  state = {
    items: [],
    currentItemId: undefined,
    flows: [],
    flowsList: [],
    filter: '',
    showBulkImport: undefined,
    page: 1,
    overallItemsCount: 0,
    showQnAModal: false,
    category: '',
    isEditing: false,
    importDialogOpen: false,
    categoryOptions: [],
    filterCategory: [],
    filterQuestion: '',
    selectedQuestion: []
  }

  fetchFlows() {
    this.props.bp.axios.get('/flows').then(({ data }) => {
      const flows = data.filter(flow => !flow.name.startsWith('skills/'))
      const flowsList = reorderFlows(flows).map(({ name }) => ({ label: getFlowLabel(name), value: name }))

      this.setState({ flows: data, flowsList })
    })
  }

  fetchData = async (page = 1) => {
    const params = { limit: ITEMS_PER_PAGE, offset: (page - 1) * ITEMS_PER_PAGE }
    const { data } = await this.props.bp.axios.get('/mod/qna/questions', { params })

    this.setState({
      items: data.items,
      overallItemsCount: data.count,
      page
    })
  }

  fetchCategories() {
    this.props.bp.axios.get('/mod/qna/categories').then(({ data: { categories } }) => {
      if (categories) {
        const categoryOptions = categories.map(category => ({ label: category, value: category }))
        this.setState({ categoryOptions })
      }
    })
  }

  componentDidUpdate(prevprops) {
    if (prevprops.contentLang !== this.props.contentLang) {
      this.filterOrFetch()
    }
    this.editQnaFromPath()
  }

  componentDidMount() {
    this.filterOrFetch()
    this.fetchFlows()
    this.fetchCategories()
    this.editQnaFromPath()
  }

  editQnaFromPath() {
    const id = this.getQnaFromPath()
    const updateModal = !this.state.showQnAModal || id !== this.state.currentItemId
    if (id && updateModal) {
      this.editItem(id)()
    }
  }

  getQnaFromPath() {
    const url = new URL(window.location.href)
    return url.searchParams.get(QNA_PARAM_NAME)
  }

  filterOrFetch() {
    const { hash } = window.location
    const searchCmd = '#search:'

    if (hash && hash.includes(searchCmd)) {
      this.setState({ filterQuestion: hash.replace(searchCmd, '') }, this.filterQuestions)
    } else {
      // tslint:disable-next-line: no-floating-promises
      this.fetchData()
    }
  }

  onCategoriesFilter = filterCategory => this.setState({ filterCategory }, this.filterQuestions)

  onQuestionsFilter = event => this.setState({ filterQuestion: event.target.value }, this.filterQuestions)

  filterQuestions = (page = 1) => {
    this.props.bp.axios
      .get('/mod/qna/questions', { params: this.getQueryParams(page) })
      .then(({ data: { items, count } }) => this.setState({ items, overallItemsCount: count, page }))
  }

  renderPagination = () => {
    const pagesCount = Math.ceil(this.state.overallItemsCount / ITEMS_PER_PAGE)
    const { filterQuestion, filterCategory } = this.state
    const isFilter = filterQuestion || filterCategory.length

    if (pagesCount <= 1) {
      return null
    }

    const fetchPage = page => () => (isFilter ? this.filterQuestions(page) : this.fetchData(page))
    const renderPageBtn = page => (
      <Pagination.Item key={'page' + page} onClick={fetchPage(page)} active={this.state.page === page}>
        {page}
      </Pagination.Item>
    )

    const firstPage = () => (isFilter ? this.filterQuestions(1) : this.fetchData(1))
    const prevPage = () =>
      this.state.page > 1 &&
      (isFilter ? this.filterQuestions(this.state.page - 1) : this.fetchData(this.state.page - 1))
    const nextPage = () =>
      this.state.page < pagesCount &&
      (isFilter ? this.filterQuestions(this.state.page + 1) : this.fetchData(this.state.page + 1))
    const lastPage = () => (isFilter ? this.filterQuestions(pagesCount) : this.fetchData(pagesCount))

    return (
      <Pagination>
        <Pagination.First onClick={firstPage} />
        <Pagination.Prev onClick={prevPage} disabled={this.state.page === 1} />
        {new Array(pagesCount).fill(pagesCount).map((_x, i) => {
          const page = i + 1
          if (Math.abs(this.state.page - page) === 5) {
            return <Pagination.Ellipsis />
          }
          if (Math.abs(this.state.page - page) > 5) {
            return null
          }
          return renderPageBtn(page)
        })}
        <Pagination.Next onClick={nextPage} disabled={this.state.page >= pagesCount} />
        <Pagination.Last onClick={lastPage} />
      </Pagination>
    )
  }

  renderQnAHeader = () => (
    <FormGroup className={style.qnaHeader}>
      <ButtonToolbar>
        <div className={style.searchBar}>{this.renderSearch()}</div>
        <ControlGroup style={{ float: 'right' }}>
          <AccessControl resource="module.qna" operation="write">
            <Button
              text="Import JSON"
              icon="download"
              id="btn-importJson"
              onClick={() => this.setState({ importDialogOpen: true })}
            />
          </AccessControl>
          <ExportButton />
        </ControlGroup>
      </ButtonToolbar>

      <ImportModal
        axios={this.props.bp.axios}
        onImportCompleted={this.fetchData}
        isOpen={this.state.importDialogOpen}
        toggle={() => this.setState({ importDialogOpen: !this.state.importDialogOpen })}
      />
    </FormGroup>
  )

  renderSearch = () => (
    <React.Fragment>
      <FormControl
        id="input-search"
        value={this.state.filterQuestion}
        onChange={this.onQuestionsFilter}
        placeholder="Search for a question"
        className={style.searchField}
      />

      <Select
        id="select-category"
        className={style.categoryFilter}
        isMulti
        value={this.state.filterCategory}
        options={this.state.categoryOptions}
        onChange={this.onCategoriesFilter}
        placeholder="Search for a category"
      />

      <AccessControl resource="module.qna" operation="write">
        <Button
          id="btn-create-qna"
          text="Add new"
          icon="add"
          intent={Intent.PRIMARY}
          onClick={() => this.setState({ isEditing: false, currentItemId: null, showQnAModal: true })}
        />
      </AccessControl>
    </React.Fragment>
  )

  getQueryParams = (overridePage?: number) => {
    const { filterQuestion, filterCategory, page } = this.state
    return {
      question: filterQuestion,
      categories: filterCategory.map(({ value }) => value),
      limit: ITEMS_PER_PAGE,
      offset: ((overridePage || page) - 1) * ITEMS_PER_PAGE
    }
  }

  deleteItem = (id: string) => async () => {
    const needDelete = await confirmDialog('Do you want to delete the question?', {
      acceptLabel: 'Delete'
    })
    const params = this.getQueryParams()

    if (needDelete) {
      this.props.bp.axios
        .post(`/mod/qna/questions/${id}/delete`, { params })
        .then(({ data }) => this.setState({ ...data }))
    }
  }

  editItem = (id: string) => () => {
    const url = new URL(window.location.href)
    url.searchParams.set(QNA_PARAM_NAME, id)
    window.history.pushState(window.history.state, '', url.toString())

    this.setState({ isEditing: true, currentItemId: id, showQnAModal: true })
  }

  toggleEnableItem = (item: any, id: string, isChecked: boolean) => {
    const params = this.getQueryParams()

    item.enabled = isChecked
    this.props.bp.axios
      .post(`/mod/qna/questions/${id}`, item, { params })
      .then(({ data: { items } }) => this.setState({ items }))
  }

  closeQnAModal = () => {
    const location = window.location
    const newUrl = location.origin + location.pathname
    window.history.pushState(window.history.state, '', newUrl)

    this.setState({ showQnAModal: false, currentItemId: null })
  }

  questionsList = () => {
    if (!this.state.items.length) {
      return <h3>No questions have been added yet.</h3>
    }

    return this.state.items.map(({ id, data }) => (
      <Item
        key={id}
        id={id}
        item={data}
        flows={this.state.flows}
        contentLang={this.props.contentLang}
        onEditItem={this.editItem(id)}
        onToggleItem={this.toggleEnableItem.bind(this)}
        onDeleteItem={this.deleteItem(id)}
      />
    ))
  }

  updateQuestion = ({ items }) => this.setState({ items })

  render() {
    return (
      <Container sidePanelHidden>
        <div />
        <Panel className={classnames(style.qnaContainer, 'qnaContainer')}>
          <Panel.Body>
            {this.renderQnAHeader()}
            {this.renderPagination()}
            {this.questionsList()}
            {this.renderPagination()}
            <EditorModal
              contentLang={this.props.contentLang}
              flows={this.state.flows}
              flowsList={this.state.flowsList}
              bp={this.props.bp}
              showQnAModal={this.state.showQnAModal}
              closeQnAModal={this.closeQnAModal}
              categories={this.state.categoryOptions}
              fetchData={this.fetchData}
              id={this.state.currentItemId}
              isEditing={this.state.isEditing}
              page={{ offset: (this.state.page - 1) * ITEMS_PER_PAGE, limit: ITEMS_PER_PAGE }}
              updateQuestion={this.updateQuestion}
              filters={{ question: this.state.filterQuestion, categories: this.state.filterCategory }}
            />
          </Panel.Body>
        </Panel>
      </Container>
    )
  }
}
