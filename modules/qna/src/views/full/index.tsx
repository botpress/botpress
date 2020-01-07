import { Button, Icon, Intent, Position, Switch, Tooltip } from '@blueprintjs/core'
import { Container } from 'botpress/ui'
import { AccessControl, Downloader, ElementPreview, getFlowLabel, reorderFlows } from 'botpress/utils'
import classnames from 'classnames'
import React, { Component } from 'react'
import { ButtonGroup, ButtonToolbar, FormControl, FormGroup, Pagination, Panel, Well } from 'react-bootstrap'
import Select from 'react-select'
import 'react-select/dist/react-select.css'

import './button.css'
import style from './style.scss'
import FormModal from './FormModal'
import { ImportModal } from './ImportModal'

const ITEMS_PER_PAGE = 50
const QNA_PARAM_NAME = 'id'

interface Props {
  contentLang: string
  bp: any
}

export default class QnaAdmin extends Component<Props> {
  state = {
    items: [],
    currentItemId: undefined,
    flows: null,
    flowsList: [],
    filter: '',
    showBulkImport: undefined,
    page: 1,
    overallItemsCount: 0,
    showQnAModal: false,
    category: '',
    QnAModalType: 'create',
    categoryOptions: [],
    filterCategory: [],
    filterQuestion: '',
    selectedQuestion: [],
    downloadUrl: undefined
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
      this.fetchData()
    }
  }

  onCategoriesFilter = filterCategory => this.setState({ filterCategory }, this.filterQuestions)

  onQuestionsFilter = event => this.setState({ filterQuestion: event.target.value }, this.filterQuestions)

  filterQuestions = (page = 1) => {
    const { filterQuestion, filterCategory } = this.state
    const question = filterQuestion
    const categories = filterCategory.map(({ value }) => value)

    this.props.bp.axios
      .get('/mod/qna/questions', {
        params: {
          question,
          categories,
          limit: ITEMS_PER_PAGE,
          offset: (page - 1) * ITEMS_PER_PAGE
        }
      })
      .then(({ data: { items, count } }) => this.setState({ items, overallItemsCount: count, page }))
  }

  downloadJson = () => {
    this.setState({ downloadUrl: `${window.BOT_API_PATH}/mod/qna/export` })
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
        <ButtonGroup style={{ float: 'right' }}>
          <ImportModal axios={this.props.bp.axios} onImportCompleted={this.fetchData} />
          <Button
            id="btn-export"
            icon="upload"
            text="Export to JSON"
            onClick={this.downloadJson}
            style={{ marginLeft: 5 }}
          />
        </ButtonGroup>
      </ButtonToolbar>
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
        multi
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
          onClick={() => this.setState({ QnAModalType: 'create', currentItemId: null, showQnAModal: true })}
        />
      </AccessControl>
    </React.Fragment>
  )

  renderVariationsOverlay = elements => {
    return (
      !!elements.length && (
        <Tooltip
          position={Position.RIGHT}
          content={
            <ul className={style.tooltip}>
              {elements.map(variation => (
                <li key={variation}>
                  {variation.startsWith('#!') ? <ElementPreview itemId={variation.replace('#!', '')} /> : variation}
                </li>
              ))}
            </ul>
          }
        >
          <span style={{ cursor: 'default' }}>
            &nbsp;
            <strong>({elements.length})</strong>
          </span>
        </Tooltip>
      )
    )
  }

  renderRedirectInfo(redirectFlow, redirectNode) {
    if (!redirectFlow || !redirectNode) {
      return null
    }

    const flowName = redirectFlow.replace('.flow.json', '')
    const flowBuilderLink = `/studio/${window.BOT_ID}/flows/${flowName}/#search:${redirectNode}`

    return (
      <React.Fragment>
        <div className={style.itemRedirectTitle}>Redirect to:</div>
        <a href={flowBuilderLink}>
          <div className={style.itemFlow}>
            Flow: <span className={style.itemFlowName}>{redirectFlow}</span>
          </div>
          <div className={style.itemNode}>
            Node: <span className={style.itemNodeName}>{redirectNode}</span>
          </div>
        </a>
      </React.Fragment>
    )
  }

  renderItem = ({ data: item, id }) => {
    if (!id) {
      return null
    }

    const questions = item.questions[this.props.contentLang] || []
    const answers = item.answers[this.props.contentLang] || []

    return (
      <Well className={style.qnaItem} bsSize="small" key={id}>
        <div className={style.itemContainer} role="entry">
          {!questions.length && (
            <div className={style.itemQuestions}>
              <a className={style.firstQuestionTitle} onClick={this.editItem(id)}>
                <Tooltip content="Missing translation">
                  <Icon icon="warning-sign" intent={Intent.DANGER} />
                </Tooltip>
                &nbsp;
                {id
                  .split('_')
                  .slice(1)
                  .join(' ')}{' '}
                &nbsp;
              </a>
            </div>
          )}
          {questions.length > 0 && (
            <div className={style.itemQuestions}>
              <span className={style.itemQuestionsTitle}>Q:</span>
              <a className={style.firstQuestionTitle} onClick={this.editItem(id)}>
                {questions[0]}
              </a>
              {this.renderVariationsOverlay(questions)}
            </div>
          )}
          {answers[0] && (
            <div className={style.itemAnswerContainer}>
              <span className={style.itemAnswerTitle}>A:</span>
              <div className={style.itemAnswerText}>{answers[0]}</div>
              {this.renderVariationsOverlay(answers)}
            </div>
          )}
          <div>
            <div className={style.itemRedirect}>{this.renderRedirectInfo(item.redirectFlow, item.redirectNode)}</div>
          </div>
          {item.category ? (
            <div className={style.questionCategory}>
              Category:{' '}
              <span className={style.questionCategoryTitle}>
                &nbsp;
                {item.category}
              </span>
            </div>
          ) : null}
        </div>
        <div className={style.itemAction}>
          <AccessControl resource="module.qna" operation="write">
            <Button icon="trash" className={style.itemActionDelete} onClick={this.deleteItem(id)} minimal={true} />
            <Switch checked={item.enabled} onChange={this.toggleEnableItem.bind(this, item, id)} large={true} />
          </AccessControl>
        </div>
      </Well>
    )
  }

  deleteItem = (id: string) => () => {
    const needDelete = confirm('Do you want to delete the question?')
    const { filterQuestion, filterCategory, page } = this.state
    const params = {
      question: filterQuestion,
      categories: filterCategory.map(({ value }) => value),
      limit: ITEMS_PER_PAGE,
      offset: (page - 1) * ITEMS_PER_PAGE
    }

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

    this.setState({ QnAModalType: 'edit', currentItemId: id, showQnAModal: true })
  }

  toggleEnableItem = (item: any, id: string, event) => {
    const { page, filterQuestion, filterCategory } = this.state
    const params = {
      limit: ITEMS_PER_PAGE,
      offset: (page - 1) * ITEMS_PER_PAGE,
      question: filterQuestion,
      categories: filterCategory
    }

    item.enabled = event.target.checked
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
    if (this.state.items.length) {
      return this.state.items.map(this.renderItem)
    }
    return <h3>No questions have been added yet.</h3>
  }

  updateQuestion = ({ items }) => this.setState({ items })

  render() {
    return (
      <Container sidePanelHidden={true}>
        <Downloader url={this.state.downloadUrl} />
        <div />
        <Panel className={classnames(style.qnaContainer, 'qnaContainer')}>
          <Panel.Body>
            {this.renderQnAHeader()}
            {this.renderPagination()}
            {this.questionsList()}
            {this.renderPagination()}
            <FormModal
              contentLang={this.props.contentLang}
              flows={this.state.flows}
              flowsList={this.state.flowsList}
              bp={this.props.bp}
              showQnAModal={this.state.showQnAModal}
              closeQnAModal={this.closeQnAModal}
              categories={this.state.categoryOptions}
              fetchData={this.fetchData}
              id={this.state.currentItemId}
              modalType={this.state.QnAModalType}
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
