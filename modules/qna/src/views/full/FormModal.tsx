import { Button, Checkbox, Classes, Dialog, FormGroup, H6, Intent, TextArea } from '@blueprintjs/core'
// @ts-ignore
import ElementsList from 'botpress/elements-list'
import { AccessControl } from 'botpress/utils'
import classnames from 'classnames'
import _ from 'lodash'
import some from 'lodash/some'
import React, { Component } from 'react'
import { Alert } from 'react-bootstrap'
import Select from 'react-select'

import style from './style.scss'
import QnaHint from './QnaHint'

const ACTIONS = {
  TEXT: 'text',
  REDIRECT: 'redirect',
  TEXT_REDIRECT: 'text_redirect'
}

interface Props {
  closeQnAModal: any
  fetchData: any
  updateQuestion: any
  page: any
  filters: any
  id: any
  modalType: any
  contentLang: any
  showQnAModal: any
  categories: any
  bp: any
  flowsList: any
  flows: any
}

export default class FormModal extends Component<Props> {
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
      isRedirect: false,
      hasDuplicates: false
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
      const { data } = await this.props.bp.axios.post(`/mod/qna/questions/${this.props.id}`, qnaItem, {
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
      <Dialog
        title={isEdit ? 'Edit Q&A' : 'Create a new Q&A'}
        icon={isEdit ? 'edit' : 'add'}
        isOpen={showQnAModal}
        onClose={this.closeAndClear}
        transitionDuration={0}
        canOutsideClickClose={false}
        style={{ width: 700 }}
        enforceFocus={false}
      >
        <div className={Classes.DIALOG_BODY}>
          <form>
            {this.alertMessage()}
            <QnaHint questions={this.itemQuestions} mlRecommendations={this.mlRecommendations} />

            <FormGroup label="Category">
              <Select
                id="select-category"
                className={classnames({ qnaCategoryError: invalidFields.category })}
                value={this.state.item.category}
                options={categories}
                onChange={this.handleSelect('category')}
                style={{ width: 250 }}
                placeholder="Search or choose category"
              />
            </FormGroup>

            <FormGroup helperText="Type/Paste your questions here separated with a new line" label="Questions">
              <TextArea
                id="input-questions"
                tabIndex={1}
                autoFocus={true}
                value={this.itemQuestions.join('\n')}
                onChange={this.updateQuestions}
                fill={true}
                rows={5}
                className={classnames({
                  qnaCategoryError: invalidFields.questions || this.state.hasDuplicates
                })}
              />
            </FormGroup>

            <H6>Answers</H6>
            <Checkbox
              label={'Bot will say: '}
              checked={this.state.isText}
              onChange={this.changeItemAction('isText')}
              tabIndex={-1}
            />

            <ElementsList
              placeholder="Type and press enter to add an answer. Use ALT+Enter for a new line"
              elements={this.itemAnswers}
              allowMultiline={true}
              onInvalid={this.state.invalidFields.answer}
              onCreate={this.createAnswer}
              onUpdate={this.updateAnswer}
              onDelete={this.deleteAnswer}
            />

            <div className={style.qnaAndOr}>
              <div className={style.qnaAndOrLine} />
              <div className={style.qnaAndOrText}>and / or</div>
              <div className={style.qnaAndOrLine} />
            </div>
            <div className={style.qnaRedirect}>
              <div className={style.qnaRedirectToFlow}>
                <Checkbox
                  label="Redirect to flow"
                  id="redirect"
                  checked={this.state.isRedirect}
                  onChange={this.changeItemAction('isRedirect')}
                  tabIndex={-1}
                />

                <Select
                  className={classnames({ qnaCategoryError: invalidFields.redirectFlow })}
                  tabIndex={-1}
                  value={this.state.item.redirectFlow}
                  options={flowsList}
                  onChange={this.handleSelect('redirectFlow')}
                />
              </div>
              <div className={style.qnaRedirectNode}>
                <strong>Node</strong>

                <Select
                  className={classnames({ qnaCategoryError: invalidFields.redirectNode })}
                  tabIndex={-1}
                  value={this.state.item.redirectNode}
                  options={nodeList}
                  onChange={this.handleSelect('redirectNode')}
                />
              </div>
            </div>
          </form>
        </div>

        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button id="btn-cancel" text="Cancel" onClick={this.closeAndClear} />
            <AccessControl resource="module.qna" operation="write">
              <Button
                id="btn-submit"
                text={isEdit ? 'Edit' : 'Save'}
                intent={Intent.PRIMARY}
                onClick={this.handleSubmit}
              />
            </AccessControl>
          </div>
        </div>
      </Dialog>
    )
  }
}
