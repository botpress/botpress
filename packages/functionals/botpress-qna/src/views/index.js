import React, { Component } from 'react'

import {
  Row,
  Col,
  FormGroup,
  ControlLabel,
  FormControl,
  InputGroup,
  Glyphicon,
  Checkbox,
  Radio,
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
import find from 'lodash/find'
import some from 'lodash/some'
import get from 'lodash/get'
import Promise from 'bluebird'

import ArrayEditor from './ArrayEditor'
import QuestionsEditor from './QuestionsEditor'
import QuestionsBulkImport from './QuestionsBulkImport'
import style from './style.scss'

const getInputValue = input => {
  switch (input.type) {
    case 'radio':
      const els = [].slice.call(document.getElementsByName(input.name))
      for (const el of els) {
        if (el.checked) {
          return el.value
        }
      }
      return null
    case 'checkbox':
      return input.checked
    default:
      return input.value
  }
}

const cleanupQuestions = questions => questions.map(q => q.trim()).filter(Boolean)

const ACTIONS = {
  TEXT: 'text',
  REDIRECT: 'redirect',
  TEXT_REDIRECT: 'text_redirect'
}

const ITEMS_PER_PAGE = 50
const CSV_STATUS_POLL_INTERVAL = 1000

export default class QnaAdmin extends Component {
  constructor(props) {
    super(props)
    this.csvDownloadableLink = React.createRef()
  }

  createEmptyQuestion() {
    return {
      id: null,
      data: {
        questions: [''],
        answer: '',
        redirectFlow: '',
        redirectNode: '',
        action: ACTIONS.TEXT,
        enabled: true
      }
    }
  }

  state = {
    newItem: this.createEmptyQuestion(),
    items: [],
    flows: null,
    filter: '',
    showBulkImport: undefined,
    page: 1,
    overallItemsCount: 0
  }

  shouldAutofocus = true

  fetchFlows() {
    this.props.bp.axios.get('/api/flows/all').then(({ data }) => {
      this.setState({ flows: data })
    })
  }

  fetchData(page = 1) {
    const params = { limit: ITEMS_PER_PAGE, offset: (page - 1) * ITEMS_PER_PAGE }
    this.props.bp.axios.get('/api/botpress-qna', { params }).then(({ data }) => {
      this.setState({ ...data, page })
    })
  }

  componentDidMount() {
    this.fetchData()
    this.fetchFlows()
  }

  onCreate = value => {
    const data = {
      ...value.data,
      questions: cleanupQuestions(value.data.questions)
    }
    return this.props.bp.axios.post('/api/botpress-qna', data).then(({ data: id }) => ({
      // update the value with the retrieved ID
      id,
      // and the cleaned data
      data
    }))
  }

  onEdit = index => {
    const value = this.state.items[index]
    this.props.bp.axios.put(`/api/botpress-qna/${value.id}`, value.data)
  }

  onDelete = value => {
    this.props.bp.axios.delete(`/api/botpress-qna/${value.id}`)
  }

  onInputChange = (index, prop, onChange) => event =>
    this.onPropChange(index, prop, onChange)(getInputValue(event.target))

  onSelectChange = (index, prop, onChange) => ({ value }) => this.onPropChange(index, prop, onChange)(value)

  onPropChange = (index, prop, onChange) => propValue => {
    const value = index == null ? this.state.newItem : this.state.items[index]
    onChange(
      {
        ...value,
        data: {
          ...value.data,
          [prop]: propValue
        }
      },
      index
    )
  }

  onQuestionsChanged = (index, onChange) => questions => {
    const value = index == null ? this.state.newItem : this.state.items[index]
    onChange(
      {
        ...value,
        data: {
          ...value.data,
          questions
        }
      },
      index
    )
  }

  updateState = newState => this.setState(newState)

  getFormControlId = (index, suffix) => `form-${index != null ? index : 'new'}-${suffix}`

  canSave = data =>
    !!cleanupQuestions(data.questions).length &&
    (data.action === ACTIONS.TEXT ? !!data.answer : !!data.redirectFlow && !!data.redirectNode)

  renderTextAndRedirectSelect(index, onChange) {
    return (
      <div>
        {this.renderTextInput(index, onChange)}
        {this.renderRedirectSelect(index, onChange)}
      </div>
    )
  }

  renderTextInput = (index, onChange) => {
    const item = index === null ? 'newItem' : `items.${index}`
    const answer = get(this.state, `${item}.data.answer`, '')

    return (
      <FormGroup controlId={this.getFormControlId(index, 'answer')}>
        <ControlLabel>Answer:</ControlLabel>
        <FormControl
          componentClass="textarea"
          placeholder="Answer"
          value={answer}
          onChange={this.onInputChange(index, 'answer', onChange)}
        />
      </FormGroup>
    )
  }

  renderRedirectSelect(index, onChange) {
    const { flows } = this.state
    if (!flows) {
      return null
    }
    const flowOptions = flows.map(({ name }) => ({ label: name, value: name }))

    const { data } = index == null ? this.state.newItem : this.state.items[index]
    const { redirectFlow } = data

    const nodeOptions = !redirectFlow
      ? []
      : get(find(flows, { name: redirectFlow }), 'nodes', []).map(({ name }) => ({ label: name, value: name }))

    return (
      <div className={style.paddedRow}>
        <Row>
          <Col sm={6} md={2}>
            Flow:
          </Col>
          <Col sm={6} md={4}>
            <Select
              value={redirectFlow}
              options={flowOptions}
              onChange={this.onSelectChange(index, 'redirectFlow', onChange)}
            />
          </Col>

          <Col sm={6} md={2}>
            Node:
          </Col>
          <Col sm={6} md={4}>
            <Select
              value={data.redirectNode}
              options={nodeOptions}
              onChange={this.onSelectChange(index, 'redirectNode', onChange)}
            />
          </Col>
        </Row>
      </div>
    )
  }

  doQuestionsBulkImport = (index, onChange) => newQuestions => {
    if (index === undefined) {
      return
    }
    this.setState({ showBulkImport: undefined })

    const value = index == null ? this.state.newItem : this.state.items[index]

    const oldQuestions = value.data.questions.map(s => s.trim()).filter(Boolean)

    onChange(
      {
        ...value,
        data: {
          ...value.data,
          questions: newQuestions.concat(oldQuestions)
        }
      },
      index
    )
  }

  showQuestionsBulkImportModal = index => () => {
    this.setState({ showBulkImport: index })
  }

  renderBulkImportModal(index, onChange) {
    return (
      <QuestionsBulkImport
        onSubmit={this.doQuestionsBulkImport(index, onChange)}
        onCancel={() => {
          this.setState({ showBulkImport: undefined })
        }}
      />
    )
  }

  renderForm = ({ data }, index, { isDirty, onCreate, onEdit, onReset, onDelete, onChange }) => {
    const { shouldAutofocus } = this
    this.shouldAutofocus = false

    const { showBulkImport } = this.state
    const saveSign = `${isDirty ? '* ' : ''}Save`

    return (
      <Well bsSize="small" bsClass={classnames('well', style.qna, { [style.pale]: !data.enabled })}>
        {index == null && <h4>New Q&amp;A</h4>}

        <Checkbox
          checked={data.enabled}
          onChange={this.onInputChange(index, 'enabled', onChange)}
          bsClass={classnames('checkbox', { [style.strong]: data.enabled })}
        >
          Enabled
        </Checkbox>

        <Panel>
          <Panel.Heading>
            Questions
            <Button bsSize="xs" bsStyle="link" onClick={this.showQuestionsBulkImportModal(index)}>
              bulk import
            </Button>
            {showBulkImport === index && this.renderBulkImportModal(index, onChange)}
          </Panel.Heading>
          <Panel.Body>
            <QuestionsEditor
              autofocus={shouldAutofocus && index == null}
              items={data.questions}
              onChange={this.onQuestionsChanged(index, onChange)}
            />
          </Panel.Body>
        </Panel>

        <FormGroup>
          <strong>Reply with:</strong>&nbsp;&nbsp;&nbsp;
          <Radio
            name={this.getFormControlId(index, 'action')}
            value={ACTIONS.TEXT}
            checked={data.action === ACTIONS.TEXT}
            onChange={this.onInputChange(index, 'action', onChange)}
            inline
          >
            text answer
          </Radio>
          <Radio
            name={this.getFormControlId(index, 'action')}
            value={ACTIONS.REDIRECT}
            checked={data.action === ACTIONS.REDIRECT}
            onChange={this.onInputChange(index, 'action', onChange)}
            inline
          >
            redirect to flow node
          </Radio>
          <Radio
            name={this.getFormControlId(index, 'action')}
            value={ACTIONS.TEXT_REDIRECT}
            checked={data.action === ACTIONS.TEXT_REDIRECT}
            onChange={this.onInputChange(index, 'action', onChange)}
            inline
          >
            text answer and redirect to flow node
          </Radio>
        </FormGroup>

        {data.action === ACTIONS.TEXT && this.renderTextInput(index, onChange)}
        {data.action === ACTIONS.REDIRECT && this.renderRedirectSelect(index, onChange)}
        {data.action === ACTIONS.TEXT_REDIRECT && this.renderTextAndRedirectSelect(index, onChange)}

        <ButtonToolbar>
          <Button type="button" onClick={() => onReset(index)} disabled={!isDirty}>
            Reset
          </Button>
          {index != null && (
            <Button type="button" bsStyle="danger" onClick={() => onDelete(index)}>
              Delete
            </Button>
          )}
          <Button
            type="button"
            bsStyle="success"
            onClick={() => (index != null ? onEdit(index) : onCreate())}
            disabled={!isDirty || !this.canSave(data)}
          >
            {index != null ? saveSign : 'Create'}
          </Button>
        </ButtonToolbar>
      </Well>
    )
  }

  onFilterChange = event => {
    this.setState({ filter: event.target.value })
  }

  questionMatches = filter => ({ data: { questions, answer, action } }, index) => {
    if (index == null || !filter) {
      return true
    }

    if (action === ACTIONS.TEXT && answer.indexOf(filter) >= 0) {
      return true
    }

    return some(questions, q => q.indexOf(filter) >= 0)
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
    this.props.bp.axios({ url: '/api/botpress-qna/csv', responseType: 'blob' }).then(response => {
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
    if (pagesCount <= 1) {
      return null
    }
    const renderPageBtn = page => (
      <Pagination.Item key={'page' + page} onClick={() => this.fetchData(page)} active={this.state.page === page}>
        {page}
      </Pagination.Item>
    )
    return (
      <Pagination>
        <Pagination.First onClick={() => this.fetchData(1)} />
        <Pagination.Prev
          onClick={() => this.state.page > 1 && this.fetchData(this.state.page - 1)}
          disabled={this.state.page === 1}
        />
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
        <Pagination.Next
          onClick={() => this.state.page < pagesCount && this.fetchData(this.state.page + 1)}
          disabled={this.state.page >= pagesCount}
        />
        <Pagination.Last onClick={() => this.fetchData(pagesCount)} />
      </Pagination>
    )
  }

  render() {
    const { csvUploadStatus } = this.state
    return (
      <Panel>
        <a
          ref={this.csvDownloadableLink}
          href={this.state.csvDownloadableLinkHref}
          download={this.state.csvDownloadableFileName}
        />
        <Panel.Body>
          <FormGroup>
            <ButtonToolbar>
              <Button
                bsStyle="success"
                onClick={() =>
                  this.setState({
                    importCsvModalShow: true,
                    csvToUpload: null,
                    csvUploadStatus: null,
                    isCsvUploadReplace: false
                  })}
                type="button"
              >
                <Glyphicon glyph="upload" /> &nbsp; Import from CSV
              </Button>
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

              <Button bsStyle="success" onClick={this.downloadCsv} type="button">
                <Glyphicon glyph="download" />&nbsp; Export to CSV
              </Button>
            </ButtonToolbar>
          </FormGroup>
          <FormGroup>
            <InputGroup>
              <FormControl placeholder="Filter questions" value={this.state.filter} onChange={this.onFilterChange} />
              <InputGroup.Addon>
                <Glyphicon glyph="search" />
              </InputGroup.Addon>
            </InputGroup>
          </FormGroup>
          <ArrayEditor
            items={this.state.items}
            shouldShowItem={this.questionMatches(this.state.filter)}
            newItem={this.state.newItem}
            renderItem={this.renderForm}
            renderPagination={this.renderPagination}
            onCreate={this.onCreate}
            onEdit={this.onEdit}
            onDelete={this.onDelete}
            updateState={this.updateState}
            createNewItem={this.createEmptyQuestion}
          />
        </Panel.Body>
      </Panel>
    )
  }
}
