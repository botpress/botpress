import { Button, Intent } from '@blueprintjs/core'
import { confirmDialog, lang } from 'botpress/shared'
import { Container } from 'botpress/ui'
import { AccessControl, getFlowLabel, reorderFlows } from 'botpress/utils'
import cx from 'classnames'
import React, { Component, Fragment } from 'react'
import { FormControl, FormGroup, Pagination, Panel } from 'react-bootstrap'

import './button.css'
import style from './style.scss'
import { ContextSelector } from './ContextSelector'
import EditorModal from './Editor/EditorModal'
import { ExportButton } from './ExportButton'
import { ImportModal } from './ImportModal'
import Item from './Item'

export { LiteEditor } from './LiteEditor'

const ITEMS_PER_PAGE = 20
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
    isEditing: false,
    importDialogOpen: false,
    filterQuestion: '',
    selectedQuestion: [],
    filterContexts: []
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

  componentDidUpdate(prevProps) {
    if (prevProps.contentLang !== this.props.contentLang) {
      this.filterOrFetch()
    }
    this.editQnaFromPath()
  }

  componentDidMount() {
    this.filterOrFetch()
    this.fetchFlows()
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

  onQuestionsFilter = event => this.setState({ filterQuestion: event.target.value }, this.filterQuestions)

  filterQuestions = (page = 1) => {
    this.props.bp.axios
      .get('/mod/qna/questions', { params: this.getQueryParams(page) })
      .then(({ data: { items, count } }) => this.setState({ items, overallItemsCount: count, page }))
  }

  renderPagination = () => {
    const pagesCount = Math.ceil(this.state.overallItemsCount / ITEMS_PER_PAGE)
    const { filterQuestion, filterContexts } = this.state
    const isFilter = filterQuestion || filterContexts.length

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
    <Fragment>
      <FormGroup className={style.qnaHeader}>
        <div className={style.searchBar}>{this.renderSearch()}</div>
        <div className={style.headerBtns}>
          <AccessControl resource="module.qna" operation="write">
            <Button
              text={lang.tr('module.qna.importJson')}
              icon="download"
              id="btn-importJson"
              onClick={() => this.setState({ importDialogOpen: true })}
            />
          </AccessControl>
          <ExportButton />

          <AccessControl resource="module.qna" operation="write">
            <Button
              id="btn-create-qna"
              text={lang.tr('module.qna.addNew')}
              icon="add"
              intent={Intent.PRIMARY}
              onClick={() => this.setState({ isEditing: false, currentItemId: null, showQnAModal: true })}
            />
          </AccessControl>
        </div>
      </FormGroup>
      <ImportModal
        axios={this.props.bp.axios}
        onImportCompleted={this.fetchData}
        isOpen={this.state.importDialogOpen}
        toggle={() => this.setState({ importDialogOpen: !this.state.importDialogOpen })}
      />
    </Fragment>
  )

  renderSearch = () => (
    <Fragment>
      <FormControl
        id="input-search"
        value={this.state.filterQuestion}
        onChange={this.onQuestionsFilter}
        placeholder={lang.tr('module.qna.search')}
        className={style.searchField}
      />

      <ContextSelector
        className={style.categoryFilter}
        contexts={this.state.filterContexts}
        saveContexts={contexts => this.setState({ filterContexts: contexts }, this.filterQuestions)}
        bp={this.props.bp}
        isSearch
      />
    </Fragment>
  )

  getQueryParams = (overridePage?: number) => {
    const { filterQuestion, filterContexts, page } = this.state
    return {
      question: filterQuestion,
      filteredContexts: filterContexts,
      limit: ITEMS_PER_PAGE,
      offset: ((overridePage || page) - 1) * ITEMS_PER_PAGE
    }
  }

  deleteItem = (id: string) => async () => {
    const needDelete = await confirmDialog(lang.tr('module.qna.confirmDelete'), {
      acceptLabel: lang.tr('delete')
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
      return <h3>{lang.tr('module.qna.noQuestionsYet')}</h3>
    }

    return (
      <div className={style.questionTable}>
        <div className={cx(style.questionTableRow, style.header)}>
          <div className={cx(style.questionTableCell, style.question)}>{lang.tr('module.qna.question')}</div>
          <div className={style.questionTableCell}>{lang.tr('module.qna.answer')}</div>
          <div className={style.questionTableCell}>{lang.tr('module.qna.contexts')}</div>
          <div className={cx(style.questionTableCell, style.actions)}></div>
        </div>
        {this.state.items.map(({ id, data }, index) => (
          <Item
            key={id}
            id={id}
            item={data}
            last={!this.state.items[index + 1]}
            flows={this.state.flows}
            contentLang={this.props.contentLang}
            onEditItem={this.editItem(id)}
            onToggleItem={this.toggleEnableItem.bind(this)}
            onDeleteItem={this.deleteItem(id)}
          />
        ))}
      </div>
    )
  }

  updateQuestion = ({ items }) => this.setState({ items })

  render() {
    return (
      <Container sidePanelHidden>
        <div />
        <Panel className={cx(style.qnaContainer, 'qnaContainer')}>
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
              fetchData={this.fetchData}
              id={this.state.currentItemId}
              isEditing={this.state.isEditing}
              defaultContext="global"
              page={{ offset: (this.state.page - 1) * ITEMS_PER_PAGE, limit: ITEMS_PER_PAGE }}
              updateQuestion={this.updateQuestion}
              filters={{ question: this.state.filterQuestion, contexts: this.state.filterContexts }}
            />
          </Panel.Body>
        </Panel>
      </Container>
    )
  }
}
