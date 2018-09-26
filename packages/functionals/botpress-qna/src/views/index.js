import React, { Component } from 'react'

import {
  FormGroup,
  FormControl,
  ControlLabel,
  Checkbox,
  Panel,
  ButtonToolbar,
  Button,
  Well,
  Modal,
  HelpBlock,
  Alert,
  Pagination
} from 'react-bootstrap'
import Select from 'react-select'

import classnames from 'classnames'
import Promise from 'bluebird'

import FormModal from './FormModal'
import style from './style.scss'
import './button.css'

const ITEMS_PER_PAGE = 50
const CSV_STATUS_POLL_INTERVAL = 1000

export default class QnaAdmin extends Component {
  constructor(props) {
    super(props)
    this.csvDownloadableLink = React.createRef()
  }

  state = {
    items: [],
    flows: null,
    flowsList: [],
    filter: '',
    showBulkImport: undefined,
    page: 1,
    overallItemsCount: 0,
    hasCategory: false,
    showQnAModal: false,
    category: '',
    QnAModalType: 'create',
    quentionsOptions: [],
    categoriesOptions: [],
    filterCategory: [],
    filterQuestion: '',
    selectedQuestion: []
  }

  shouldAutofocus = true

  fetchFlows() {
    this.props.bp.axios.get('/api/flows/all').then(({ data }) => {
      const flowsList = data.map(({ name }) => ({ label: name, value: name }))

      this.setState({ flows: data, flowsList })
    })
  }

  fetchData = (page = 1) => {
    const params = { limit: ITEMS_PER_PAGE, offset: (page - 1) * ITEMS_PER_PAGE }
    this.props.bp.axios.get('/api/botpress-qna', { params }).then(({ data }) => {
      const quentionsOptions = data.items.map(({ id, data: { questions } }) => ({
        label: questions.join(','),
        value: id
      }))

      this.setState({ ...data, page, quentionsOptions })
    })
  }

  fetchCategories() {
    this.props.bp.axios.get('/api/botpress-qna/category/list').then(({ data: { categories } }) => {
      const categoriesOptions = categories.map(category => ({ label: category, value: category }))

      this.setState({ categoriesOptions })
    })
  }

  componentDidMount() {
    this.fetchData()
    this.fetchFlows()
    this.fetchCategories()
  }

  onCategoriesFilter = filterCategory => this.setState({ filterCategory }, this.filterQuestions)

  onQuestioinsFilter = event => this.setState({ filterQuestion: event.target.value }, this.filterQuestions)

  filterQuestions = (page = 1) => {
    const { filterQuestion, filterCategory } = this.state
    const question = filterQuestion
    const categories = filterCategory.map(({ value }) => value)

    this.props.bp.axios
      .get('/api/botpress-qna/questions/filter', {
        params: {
          question,
          categories,
          limit: ITEMS_PER_PAGE,
          offset: (page - 1) * ITEMS_PER_PAGE
        }
      })
      .then(({ data: { items, count } }) => this.setState({ items, overallItemsCount: count, page }))
  }

  uploadCsv = async () => {
    const formData = new FormData()
    formData.set('isReplace', this.state.isCsvUploadReplace)
    formData.append('csv', this.state.csvToUpload)

    const headers = { 'Content-Type': 'multipart/form-data' }
    const { data: csvStatusId } = await this.props.bp.axios.post('/api/botpress-qna/csv', formData, { headers })

    this.setState({ csvStatusId })

    while (this.state.csvStatusId) {
      try {
        const { data: status } = await this.props.bp.axios.get(`/api/botpress-qna/csv-upload-status/${csvStatusId}`)

        this.setState({ csvUploadStatus: status })

        if (status === 'Completed') {
          this.setState({ csvStatusId: null, importCsvModalShow: false })
          this.fetchData()
        } else if (status.startsWith('Error')) {
          this.setState({ csvStatusId: null })
        }

        await Promise.delay(CSV_STATUS_POLL_INTERVAL)
      } catch (e) {
        return this.setState({ csvUploadStatus: 'Server Error', csvStatusId: null })
      }
    }
  }

  downloadCsv = () =>
    // We can't just download file directly due to security restrictions
    this.props.bp.axios({ method: 'get', url: '/api/botpress-qna/csv', responseType: 'blob' }).then(response => {
      this.setState(
        {
          csvDownloadableLinkHref: window.URL.createObjectURL(new Blob([response.data])),
          csvDownloadableFileName: /filename=(.*\.csv)/.exec(response.headers['content-disposition'])[1]
        },
        () => this.csvDownloadableLink.current.click()
      )
    })

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
        {new Array(pagesCount).fill().map((_x, i) => {
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

  renderImportModal() {
    const { csvUploadStatus } = this.state

    return (
      <Modal show={this.state.importCsvModalShow} onHide={() => this.setState({ importCsvModalShow: false })}>
        <Modal.Header closeButton>
          <Modal.Title>Import CSV</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {csvUploadStatus && (
            <Alert
              bsStyle={csvUploadStatus.startsWith('Error') ? 'danger' : 'info'}
              onDismiss={() => this.setState({ csvUploadStatus: null })}
            >
              <p>{this.state.csvUploadStatus}</p>
            </Alert>
          )}
          <form>
            <FormGroup>
              <ControlLabel>CSV file</ControlLabel>
              <FormControl
                type="file"
                accept=".csv"
                onChange={e => this.setState({ csvToUpload: e.target.files[0] })}
              />
              <HelpBlock>CSV should be formatted &quot;question,answer_type,answer&quot;</HelpBlock>
            </FormGroup>
            <FormGroup>
              <Checkbox
                checked={this.state.isCsvUploadReplace}
                onChange={e => this.setState({ isCsvUploadReplace: e.target.checked })}
              >
                Replace existing FAQs
              </Checkbox>
              <HelpBlock>Deletes existing FAQs and then uploads new ones from the file</HelpBlock>
            </FormGroup>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button bsStyle="primary" onClick={this.uploadCsv} disabled={!Boolean(this.state.csvToUpload)}>
            Upload
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }

  renderQnAHeader = () => (
    <FormGroup className={style['qna-header']}>
      <ButtonToolbar className={style.csvContainer}>
        <Button
          className={style.csvButton}
          onClick={() =>
            this.setState({
              importCsvModalShow: true,
              csvToUpload: null,
              csvUploadStatus: null,
              isCsvUploadReplace: false
            })}
          type="button"
        >
          Import from CSV
        </Button>
        <Button className={style.csvButton} onClick={this.downloadCsv} type="button">
          Export to CSV
        </Button>
        {this.renderImportModal()}
      </ButtonToolbar>
    </FormGroup>
  )

  renderSearch = () => (
    <div className={classnames(style['qna-nav-bar'], 'qna-nav-bar')}>
      <div className={style['search-bar']}>
        <FormControl
          className={style['serach-questions']}
          value={this.state.filterQuestion}
          onChange={this.onQuestioinsFilter}
          placeholder="Filter questions"
        />
        {this.state.hasCategory ? (
          <Select
            className={style['serach-questions']}
            multi
            value={this.state.filterCategory}
            options={this.state.categoriesOptions}
            onChange={this.onCategoriesFilter}
            placeholder="Filter caterories"
          />
        ) : null}
      </div>
      <Button
        className={style['qna-nav-bar__add-new']}
        bsStyle="success"
        onClick={() => this.setState({ QnAModalType: 'create', currentItemId: null }, this.toggleQnAModal)}
        type="button"
      >
        + Add new
      </Button>
    </div>
  )

  renderItem = ({ data: item, id }) => {
    if (!id) {
      return null
    }

    const isRedirect = item.redirectFlow && item.redirectNode

    return (
      <Well className={style['qna-item']} bsSize="small">
        <div className={style['item-container']}>
          <div className={style['item-questions']}>
            <span className={style['item-questions__title']}>Q: </span>
            <div className={style['questions-list']}>{this.renderQustions(item.questions)}</div>
          </div>
          <div className={style['item-answer-container']}>
            <span className={style['item-answer__title']}>A: </span>
            <div className={style['item-answer']}>
              <span className={style['item-answer__text']}>{item.answer}</span>
              <div className={style['item-redirect']}>
                {isRedirect ? (
                  <div className={style['item-flow']}>
                    Flow: <span className={style['item-flow__name']}>{item.redirectFlow}</span>
                  </div>
                ) : null}
                {isRedirect ? (
                  <div className={style['item-node']}>
                    Node: <span className={style['item-node__name']}>{item.redirectNode}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          {this.state.hasCategory || item.category ? (
            <div className={style['question-category']}>
              Category: <span className={style['question-category__title']}>&nbsp;{item.category}</span>
            </div>
          ) : null}
        </div>
        <div className={style['item-action']}>
          {this.toggleButton({ value: item.enabled, onChange: this.enabledItem(item, id) })}
          <i className={classnames('material-icons', style['item-action__delete'])} onClick={this.deleteItem(id)}>
            delete
          </i>
          <i className={classnames('material-icons', style['item-action__edit'])} onClick={this.editItem(id)}>
            edit
          </i>
        </div>
      </Well>
    )
  }

  deleteItem = id => () => {
    const needDetelete = confirm('Do you want delete question?')
    const { filterQuestion, filterCategory, page } = this.state
    const params = {
      question: filterQuestion,
      categories: filterCategory.map(({ value }) => value),
      limit: ITEMS_PER_PAGE,
      offset: (page - 1) * ITEMS_PER_PAGE
    }

    if (needDetelete) {
      this.props.bp.axios.delete(`/api/botpress-qna/${id}`, { params }).then(({ data }) => this.setState({ ...data }))
    }
  }

  editItem = id => () => {
    this.setState({ QnAModalType: 'edit', currentItemId: id }, this.toggleQnAModal)
  }

  enabledItem = (item, id) => value => {
    const { page } = this.state
    const params = { limit: ITEMS_PER_PAGE, offset: (page - 1) * ITEMS_PER_PAGE }

    item.enabled = value
    this.props.bp.axios
      .put(`/api/botpress-qna/${id}`, item, { params })
      .then(({ data: items }) => this.setState({ items }))
  }

  renderQustions = questions =>
    questions.map(question => (
      <div key={question} className={style['question-text']}>
        {question}
      </div>
    ))

  toggleButton = ({ value, onChange }) => {
    const toggleCssClass = classnames('slider', { checked: value })

    return (
      <label className={classnames('switch', style['toggle-button'])}>
        <input className="toggle-input" value={value} onChange={() => onChange(!value)} type="checkbox" />
        <span className={toggleCssClass} />
      </label>
    )
  }

  toggleQnAModal = () => this.setState({ showQnAModal: !this.state.showQnAModal })

  questionsList = () => this.state.items.map(this.renderItem)

  updateQuestion = ({ items }) => this.setState({ items })

  render() {
    return (
      <Panel className={`${style['qna-container']} qna-container`}>
        <a
          ref={this.csvDownloadableLink}
          href={this.state.csvDownloadableLinkHref}
          download={this.state.csvDownloadableFileName}
        />
        <Panel.Body>
          {this.renderQnAHeader()}
          {this.renderSearch()}
          {this.renderPagination()}
          {this.questionsList()}
          {this.renderPagination()}
          <FormModal
            flows={this.state.flows}
            flowsList={this.state.flowsList}
            bp={this.props.bp}
            showQnAModal={this.state.showQnAModal}
            toggleQnAModal={this.toggleQnAModal}
            hasCategory={this.state.hasCategory}
            categories={this.state.categoriesOptions}
            fetchData={this.fetchData}
            id={this.state.currentItemId}
            modalType={this.state.QnAModalType}
            page={{ offset: (this.state.page - 1) * ITEMS_PER_PAGE, limit: ITEMS_PER_PAGE }}
            updateQuestion={this.updateQuestion}
            filters={{ question: this.state.filterQuestion, categories: this.state.filterCategory }}
          />
        </Panel.Body>
      </Panel>
    )
  }
}
