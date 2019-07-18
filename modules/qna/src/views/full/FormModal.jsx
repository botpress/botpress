import React, { Component } from 'react'
import { FormControl, Button, Modal, Alert } from 'react-bootstrap'
import classnames from 'classnames'
import some from 'lodash/some'
import ElementsList from 'botpress/elements-list'
import _ from 'lodash'
import Select from 'react-select'
import style from './style.scss'
import QnaHint from './QnaHint'

const ACTIONS = {
  TEXT: 'text',
  REDIRECT: 'redirect',
  TEXT_REDIRECT: 'text_redirect'
}

export default class FormModal extends Component {
  state = this.defaultState

  get defaultState() {
    return {
      item: {
        answers: {},
        questions: {},
        redirectFlow: '',
        redirectNode: '',
        action: ACTIONS.TEXT,
        category: 'global',
        enabled: true
      },
      invalidFields: {
        category: false,
        questions: false,
        answer: false,
        checkbox: false,
        redirectFlow: false,
        redirectNode: false
      },
      errorMessage: undefined,
      isText: true,
      isRedirect: false
    }
  }

  mlRecommendations = {
    minUtterancesForML: undefined,
    goodUtterancesForML: undefined
  }

  async componentDidMount() {
    const { data } = await this.props.bp.axios.get('/mod/nlu/ml-recommendations')
    this.mlRecommendations = data
  }

  async componentDidUpdate(prevProps) {
    const { id } = this.props
    if (prevProps.id === id) {
      return
    }
    if (!id) {
      return this.setState(this.defaultState)
    }

    const {
      data: { data: item }
    } = await this.props.bp.axios.get(`/mod/qna/questions/${id}`)

    this.setState({
      item,
      isRedirect: [ACTIONS.REDIRECT, ACTIONS.TEXT_REDIRECT].includes(item.action),
      isText: [ACTIONS.TEXT, ACTIONS.TEXT_REDIRECT].includes(item.action)
    })
  }

  closeAndClear = () => {
    this.props.closeQnAModal()
    this.setState(this.defaultState)
  }

  changeItemProperty = (keyPath, value) => {
    const { item } = this.state

    _.set(item, keyPath, value)
    this.setState(item)
  }

  handleSelect = key => selectedOption =>
    this.changeItemProperty(key, selectedOption ? selectedOption.value : selectedOption)

  changeItemAction = actionType => () => {
    this.setState({ [actionType]: !this.state[actionType] }, () => {
      const { isText, isRedirect } = this.state
      const action = isText && isRedirect ? ACTIONS.TEXT_REDIRECT : isRedirect ? ACTIONS.REDIRECT : ACTIONS.TEXT

      this.changeItemProperty('action', action)
    })
  }

  validateForm() {
    const { item, isText, isRedirect } = this.state
    const invalidFields = {
      questions: !this.itemQuestions.length || !this.itemQuestions[0].length,
      answer: isText && (!this.itemAnswers.length || !this.itemAnswers[0].length),
      checkbox: !(isText || isRedirect),
      redirectFlow: isRedirect && !item.redirectFlow,
      redirectNode: isRedirect && !item.redirectNode
    }
    const hasDuplicates = this.isQuestionDuplicated()

    this.setState({ invalidFields, hasDuplicates, errorMessage: undefined })
    return some(invalidFields) || hasDuplicates
  }

  isQuestionDuplicated() {
    const questions = this.trimItemQuestions(this.itemQuestions)

    return _.some(questions, (value, index) => _.includes(questions, value, Number(index) + 1))
  }

  trimItemQuestions = questions => {
    return questions.map(q => q.trim()).filter(q => q !== '')
  }

  onCreate = async qnaItem => {
    try {
      await this.props.bp.axios.post('/mod/qna/questions', qnaItem)

      this.props.fetchData()
      this.closeAndClear()
    } catch (error) {
      this.setState({ errorMessage: _.get(error, 'response.data.full', error.message) })
    }
  }

  onEdit = async qnaItem => {
    const {
      page,
      filters: { question, categories }
    } = this.props

    try {
      const { data } = await this.props.bp.axios.put(`/mod/qna/questions/${this.props.id}`, qnaItem, {
        params: { ...page, question, categories: categories.map(({ value }) => value) }
      })

      this.props.updateQuestion(data)
      this.closeAndClear()
    } catch (error) {
      this.setState({ errorMessage: _.get(error, 'response.data.full', error.message) })
    }
  }

  alertMessage() {
    const hasInvalidInputs = Object.values(this.state.invalidFields).find(Boolean)
    const missingTranslations =
      this.props.modalType === 'edit' && (!this.itemAnswers.length || !this.itemQuestions.length)

    return (
      <div>
        {this.state.invalidFields.checkbox && <Alert bsStyle="danger">Action checkbox is required</Alert>}
        {hasInvalidInputs && <Alert bsStyle="danger">Inputs are required.</Alert>}
        {this.state.hasDuplicates && <Alert bsStyle="danger">Duplicated questions aren't allowed.</Alert>}
        {this.state.errorMessage && <Alert bsStyle="danger">{this.state.errorMessage}</Alert>}
        {missingTranslations && <Alert bsStyle="danger">Missing translations</Alert>}
      </div>
    )
  }

  handleSubmit = event => {
    event.preventDefault()
    if (this.validateForm()) {
      return
    }

    const itemToSend = { ...this.state.item }
    itemToSend.questions = {
      ...itemToSend.questions,
      ...{ [this.props.contentLang]: this.trimItemQuestions(this.itemQuestions) }
    }

    this.props.modalType === 'edit' ? this.onEdit(itemToSend) : this.onCreate(itemToSend)
  }

  get itemAnswers() {
    return this.state.item.answers[this.props.contentLang] || []
  }

  get itemQuestions() {
    return this.state.item.questions[this.props.contentLang] || []
  }

  createAnswer = answer => {
    const answers = [...this.itemAnswers, answer]

    this.changeItemProperty(`answers.${this.props.contentLang}`, answers)
  }

  updateAnswer = (answer, index) => {
    const answers = this.itemAnswers
    if (answers[index]) {
      answers[index] = answer
      this.changeItemProperty(`answers.${this.props.contentLang}`, answers)
    }
  }

  deleteAnswer = index => {
    const answers = this.itemAnswers
    if (answers[index]) {
      answers.splice(index, 1)
      this.changeItemProperty(`answers.${this.props.contentLang}`, answers)
    }
  }

  updateQuestions = event => {
    this.changeItemProperty(`questions.${this.props.contentLang}`, event.target.value.split(/\n/))
  }

  render() {
    const {
      item: { redirectFlow },
      invalidFields
    } = this.state
    const { flows, flowsList, showQnAModal, categories, modalType } = this.props
    const currentFlow = flows ? flows.find(({ name }) => name === redirectFlow) || { nodes: [] } : { nodes: [] }
    const nodeList = currentFlow.nodes.map(({ name }) => ({ label: name, value: name }))
    const isEdit = modalType === 'edit'

    return (
      <Modal
        className={classnames(style.newQnaModal, 'newQnaModal')}
        show={showQnAModal}
        onHide={this.closeAndClear}
        backdrop={'static'}
      >
        <form>
          <Modal.Header className={style.qnaModalHeader}>
            <Modal.Title>{!isEdit ? 'Create a new' : 'Edit'} Q&A</Modal.Title>
          </Modal.Header>

          <Modal.Body className={style.qnaModalBody}>
            {this.alertMessage()}
            {categories.length ? (
              <div className={style.qnaSection}>
                <span className={style.qnaSectionTitle}>Category</span>
                <Select
                  className={classnames(style.qnaCategorySelect, {
                    qnaCategoryError: invalidFields.category
                  })}
                  value={this.state.item.category}
                  options={categories}
                  onChange={this.handleSelect('category')}
                  placeholder="Search or choose category"
                />
              </div>
            ) : null}
            <div className={style.qnaSection}>
              <QnaHint questions={this.itemQuestions} mlRecommendations={this.mlRecommendations} />
              <span className={style.qnaSectionTitle}>Questions</span>
              <span className={style.qnaQuestionsHint}>Type/Paste your questions here separated with a new line</span>

              <FormControl
                autoFocus={true}
                className={classnames(style.qnaQuestionsTextarea, {
                  qnaCategoryError: invalidFields.questions || this.state.hasDuplicates
                })}
                value={this.itemQuestions.join('\n')}
                onChange={this.updateQuestions}
                componentClass="textarea"
              />
            </div>
            <div className={style.qnaSection}>
              <span className={style.qnaSectionTitle}>Answers</span>
              <div className={style.qnaAnswer}>
                <span className={style.qnaAnswerCheck}>
                  <input
                    id="reply"
                    type="checkbox"
                    checked={this.state.isText}
                    onChange={this.changeItemAction('isText')}
                    tabIndex="-1"
                  />
                  <label htmlFor="reply">&nbsp; Bot will say:</label>
                </span>

                <ElementsList
                  placeholder="Type and press enter to add an answer. Use ALT+Enter for a new line"
                  elements={this.itemAnswers}
                  allowMultiline={true}
                  onInvalid={this.state.invalidFields.answer}
                  onCreate={this.createAnswer}
                  onUpdate={this.updateAnswer}
                  onDelete={this.deleteAnswer}
                />
              </div>

              <div className={style.qnaAndOr}>
                <div className={style.qnaAndOrLine} />
                <div className={style.qnaAndOrText}>and / or</div>
                <div className={style.qnaAndOrLine} />
              </div>
              <div className={style.qnaRedirect}>
                <div className={style.qnaRedirectToFlow}>
                  <span className={style.qnaRedirectToFlowCheck}>
                    <input
                      id="redirect"
                      type="checkbox"
                      checked={this.state.isRedirect}
                      onChange={this.changeItemAction('isRedirect')}
                      className={style.qnaRedirectToFlowCheckCheckbox}
                      tabIndex="-1"
                    />
                    <label htmlFor="redirect">&nbsp;Redirect to flow</label>
                  </span>
                  <Select
                    className={classnames(style.qnaRedirectToFlowCheckSelect, {
                      qnaCategoryError: invalidFields.redirectFlow
                    })}
                    value={this.state.item.redirectFlow}
                    options={flowsList}
                    onChange={this.handleSelect('redirectFlow')}
                  />
                </div>
                <div className={style.qnaRedirectNode}>
                  <span className={style.qnaRedirectNodeTitle}>Node</span>
                  <Select
                    className={classnames(style.qnaRedirectNodeSelect, {
                      qnaCategoryError: invalidFields.redirectNode
                    })}
                    value={this.state.item.redirectNode}
                    options={nodeList}
                    onChange={this.handleSelect('redirectNode')}
                  />
                </div>
              </div>
            </div>
          </Modal.Body>

          <Modal.Footer className={style.qnaModalFooter}>
            <Button onClick={this.closeAndClear}>Cancel</Button>
            <Button bsStyle="primary" type="button" onClick={this.handleSubmit}>
              {isEdit ? 'Edit' : 'Save'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    )
  }
}
