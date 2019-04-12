import React, { Component } from 'react'

import {
  FormGroup,
  FormControl,
  ControlLabel,
  Checkbox,
  Panel,
  OverlayTrigger,
  ButtonGroup,
  ButtonToolbar,
  Button,
  Well,
  Modal,
  HelpBlock,
  Alert,
  Pagination,
  Popover
} from 'react-bootstrap'
import Select from 'react-select'

import classnames from 'classnames'
import Promise from 'bluebird'

import FormModal from './FormModal'
import style from './style.scss'
import 'react-select/dist/react-select.css'
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
    showQnAModal: false,
    category: '',
    QnAModalType: 'create',
    quentionsOptions: [],
    categoryOptions: [],
    filterCategory: [],
    filterQuestion: '',
    selectedQuestion: []
  }

  shouldAutofocus = true

  fetchFlows() {
    this.props.bp.axios.get('/flows').then(({ data }) => {
      const flowsList = data
        .filter(flow => !flow.name.startsWith('skills/'))
        .map(({ name }) => ({ label: name, value: name }))

      this.setState({ flows: data, flowsList })
    })
  }

  fetchData = (page = 1) => {
    const params = { limit: ITEMS_PER_PAGE, offset: (page - 1) * ITEMS_PER_PAGE }
    this.props.bp.axios.get('/mod/qna/questions', { params }).then(({ data }) => {
      const quentionsOptions = data.items.map(({ id, data: { questions } }) => ({
        label: (questions || []).join(','),
        value: id
      }))

      this.setState({
        items: data.items,
        overallItemsCount: data.count,
        page,
        quentionsOptions
      })
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

  componentDidMount() {
    this.filterOrFetch()
    this.fetchFlows()
    this.fetchCategories()
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

  uploadCsv = async () => {
    const formData = new FormData()
    formData.set('isReplace', this.state.isCsvUploadReplace)
    formData.append('csv', this.state.csvToUpload)

    const headers = { 'Content-Type': 'multipart/form-data' }
    const { data: csvStatusId } = await this.props.bp.axios.post('/mod/qna/import/csv', formData, { headers })

    this.setState({ csvStatusId })

    while (this.state.csvStatusId) {
      try {
        const { data: status } = await this.props.bp.axios.get(`/mod/qna/csv-upload-status/${csvStatusId}`)

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
    this.props.bp.axios({ method: 'get', url: '/mod/qna/export/csv', responseType: 'blob' }).then(response => {
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
      <Modal
        show={this.state.importCsvModalShow}
        onHide={() => this.setState({ importCsvModalShow: false })}
        backdrop={'static'}
      >
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
              <HelpBlock>CSV should be formatted &quot;question,answer_type,answer,answer2,category&quot;</HelpBlock>
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
    <FormGroup className={style.qnaHeader}>
      <ButtonToolbar>
        <div className={style.searchBar}>
          {this.renderSearch()}
          {this.renderImportModal()}
        </div>
        <ButtonGroup style={{ float: 'right' }}>
          <Button
            bsStyle="default"
            onClick={() =>
              this.setState({
                importCsvModalShow: true,
                csvToUpload: null,
                csvUploadStatus: null,
                isCsvUploadReplace: false
              })
            }
            type="button"
          >
            Import from CSV
          </Button>
          <Button bsStyle="default" onClick={this.downloadCsv} type="button">
            Export to CSV
          </Button>
        </ButtonGroup>
      </ButtonToolbar>
    </FormGroup>
  )

  renderSearch = () => (
    <React.Fragment>
      <FormControl
        value={this.state.filterQuestion}
        onChange={this.onQuestionsFilter}
        placeholder="Search for a question"
        className={style.searchField}
      />
      {this.state.categoryOptions.length && (
        <Select
          className={style.categoryFilter}
          multi
          value={this.state.filterCategory}
          options={this.state.categoryOptions}
          onChange={this.onCategoriesFilter}
          placeholder="Search for a category"
        />
      )}
      <Button
        className={style.qnaNavBarAddNew}
        bsStyle="primary"
        onClick={() => this.setState({ QnAModalType: 'create', currentItemId: null, showQnAModal: true })}
      >
        Add new
      </Button>
    </React.Fragment>
  )

  renderVariationsOverlay = variations => {
    return (
      <Popover id="questions-popover">
        <ul className={style.questionsList}>
          {variations.map(variation => (
            <li key={variation}>{variation}</li>
          ))}
        </ul>
      </Popover>
    )
  }

  renderVariationsOverlayTrigger = elements => {
    return (
      elements.length > 1 && (
        <OverlayTrigger trigger={['hover', 'focus']} placement="right" overlay={this.renderVariationsOverlay(elements)}>
          <span>
            &nbsp;
            <strong>({elements.length})</strong>
          </span>
        </OverlayTrigger>
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

    return (
      <Well className={style.qnaItem} bsSize="small" key={id}>
        <div className={style.itemContainer}>
          <div className={style.itemQuestions}>
            <span className={style.itemQuestionsTitle}>Q:</span>
            <a className={style.firstQuestionTitle} onClick={this.editItem(id)}>
              {item.questions[0]}
            </a>
            {this.renderVariationsOverlayTrigger(item.questions)}
          </div>
          {item.answers[0] && (
            <div className={style.itemAnswerContainer}>
              <span className={style.itemAnswerTitle}>A:</span>
              <div className={style.itemAnswerText}>{item.answers[0]}</div>
              {this.renderVariationsOverlayTrigger(item.answers)}
            </div>
          )}
          <div className={style.itemRedirectContainer}>
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
          <i className={classnames('material-icons', style.itemActionDelete)} onClick={this.deleteItem(id)}>
            delete
          </i>
          {this.toggleButton({ value: item.enabled, onChange: this.enabledItem(item, id) })}
        </div>
      </Well>
    )
  }

  deleteItem = id => () => {
    const needDelete = confirm('Do you want to delete the question?')
    const { filterQuestion, filterCategory, page } = this.state
    const params = {
      question: filterQuestion,
      categories: filterCategory.map(({ value }) => value),
      limit: ITEMS_PER_PAGE,
      offset: (page - 1) * ITEMS_PER_PAGE
    }

    if (needDelete) {
      this.props.bp.axios.delete(`/mod/qna/questions/${id}`, { params }).then(({ data }) => this.setState({ ...data }))
    }
  }

  editItem = id => () => {
    this.setState({ QnAModalType: 'edit', currentItemId: id, showQnAModal: true })
  }

  enabledItem = (item, id) => value => {
    const { page, filterQuestion, filterCategory } = this.state
    const params = {
      limit: ITEMS_PER_PAGE,
      offset: (page - 1) * ITEMS_PER_PAGE,
      question: filterQuestion,
      categories: filterCategory
    }

    item.enabled = value
    this.props.bp.axios
      .put(`/mod/qna/questions/${id}`, item, { params })
      .then(({ data: { items } }) => this.setState({ items }))
  }

  toggleButton = ({ value, onChange }) => {
    const toggleCssClass = classnames('slider', { checked: value })

    return (
      <label className={classnames('switch', style.toggleButton)}>
        <input className="toggle-input" value={value} onChange={() => onChange(!value)} type="checkbox" tabIndex="-1" />
        <span className={toggleCssClass} />
      </label>
    )
  }

  closeQnAModal = () => this.setState({ showQnAModal: false, currentItemId: null })

  questionsList = () => {
    if (this.state.items.length) {
      return this.state.items.map(this.renderItem)
    }
    return <h3>No questions have been added yet.</h3>
  }

  updateQuestion = ({ items }) => this.setState({ items })

  render() {
    return (
      <Panel className={classnames(style.qnaContainer, 'qnaContainer')}>
        <a
          ref={this.csvDownloadableLink}
          href={this.state.csvDownloadableLinkHref}
          download={this.state.csvDownloadableFileName}
        />
        <Panel.Body>
          {this.renderQnAHeader()}
          {this.renderPagination()}
          {this.questionsList()}
          {this.renderPagination()}
          <FormModal
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
    )
  }
}
