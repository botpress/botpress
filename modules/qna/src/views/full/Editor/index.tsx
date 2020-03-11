import { Button, Callout, Checkbox, Classes, FormGroup, H6, Intent, TextArea } from '@blueprintjs/core'
// @ts-ignore
import ElementsList from 'botpress/elements-list'
import { AccessControl, getFlowLabel } from 'botpress/utils'
import classnames from 'classnames'
import _ from 'lodash'
import some from 'lodash/some'
import React, { Component } from 'react'
import Select from 'react-select'

import style from '../style.scss'
import QnaHint from '../QnaHint'

export const ACTIONS = {
  TEXT: 'text',
  REDIRECT: 'redirect',
  TEXT_REDIRECT: 'text_redirect'
}

interface Props {
  closeQnAModal: () => void
  fetchData: () => void
  updateQuestion: (data: any) => void
  page: any
  filters: any
  id: string
  category?: any
  hideCategories?: boolean
  isLite?: boolean
  isEditing: boolean
  contentLang: string
  categories?: any[]
  bp: any
  flowsList?: any[]
  flows?: any[]
}

const DEFAULT_CATEGORY = { label: 'global', value: 'global' }

export default class Editor extends Component<Props> {
  state = this.defaultState

  get defaultState() {
    return {
      item: {
        answers: {},
        questions: {},
        redirectFlow: { label: '', value: '' },
        redirectNode: { label: '', value: '' },
        action: ACTIONS.TEXT,
        category: this.props.category || DEFAULT_CATEGORY,
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
      hasDuplicates: false,
      isIncorrectRedirection: false
    }
  }

  mlRecommendations = {
    minUtterancesForML: undefined,
    goodUtterancesForML: undefined
  }

  async componentDidMount() {
    const { data } = await this.props.bp.axios.get('/mod/nlu/ml-recommendations')
    this.mlRecommendations = data

    if (!this.props.id) {
      return this.setState(this.defaultState)
    }

    const {
      data: { data: item }
    } = await this.props.bp.axios.get(`/mod/qna/questions/${this.props.id}`)

    item.category = { label: item.category, value: item.category }
    item.redirectFlow = { label: getFlowLabel(item.redirectFlow), value: item.redirectFlow }
    item.redirectNode = { label: item.redirectNode, value: item.redirectNode }
    this.setState({
      item,
      isRedirect: [ACTIONS.REDIRECT, ACTIONS.TEXT_REDIRECT].includes(item.action),
      isText: [ACTIONS.TEXT, ACTIONS.TEXT_REDIRECT].includes(item.action)
    })
  }

  closeAndClear = () => {
    this.setState(this.defaultState)
    this.props.closeQnAModal()
  }

  changeItemProperty = (keyPath, value) => {
    const { item } = this.state

    _.set(item, keyPath, value)
    this.setState(item)
  }

  handleSelect = key => selectedOption => this.changeItemProperty(key, selectedOption)

  changeItemAction = actionType => () => {
    this.setState({ [actionType]: !this.state[actionType] }, () => {
      const { isText, isRedirect } = this.state
      const action = isText && isRedirect ? ACTIONS.TEXT_REDIRECT : isRedirect ? ACTIONS.REDIRECT : ACTIONS.TEXT

      if (!isRedirect) {
        this.state.item.redirectFlow = { label: '', value: '' }
        this.state.item.redirectNode = { label: '', value: '' }
      }
      this.changeItemProperty('action', action)
    })
  }

  validateForm() {
    const { item, isText, isRedirect } = this.state
    const invalidFields = {
      questions: !this.itemQuestions.length || !this.itemQuestions[0].length,
      answer: isText && (!this.itemAnswers.length || !this.itemAnswers[0].length),
      checkbox: !(isText || isRedirect),
      redirectFlow: isRedirect && !item.redirectFlow.value,
      redirectNode: isRedirect && !item.redirectNode.value
    }
    const hasDuplicates = this.isQuestionDuplicated()
    const isIncorrectRedirection = !this.isValidRedirection()

    this.setState({ invalidFields, hasDuplicates, isIncorrectRedirection, errorMessage: undefined })
    return some(invalidFields) || hasDuplicates || isIncorrectRedirection
  }

  isValidRedirection() {
    if (!this.state.isRedirect || this.props.isLite) {
      return true
    }
    const flow = _.find(this.props.flows, f => f.name === this.state.item.redirectFlow.value)
    return flow && _.find(flow.nodes, n => n.name === this.state.item.redirectNode.value)
  }

  isQuestionDuplicated() {
    const questions = this.trimItemQuestions(this.itemQuestions)

    return _.some(questions, (value, index) => _.includes(questions, value, Number(index) + 1))
  }

  trimItemQuestions = questions => {
    return questions.map(q => q.trim()).filter(q => q !== '')
  }

  onCreate = async qnaItem => {
    qnaItem.category = qnaItem.category.value
    qnaItem.redirectFlow = qnaItem.redirectFlow.value
    qnaItem.redirectNode = qnaItem.redirectNode.value
    try {
      await this.props.bp.axios.post('/mod/qna/questions', qnaItem)

      this.props.fetchData()
      this.closeAndClear()
    } catch (error) {
      this.setState({ errorMessage: _.get(error, 'response.data.full', error.message) })
    }
  }

  onEdit = async qnaItem => {
    qnaItem.category = qnaItem.category.value
    qnaItem.redirectFlow = qnaItem.redirectFlow.value
    qnaItem.redirectNode = qnaItem.redirectNode.value
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
      this.props.isEditing && (!this.itemQuestions.length || (!this.itemAnswers.length && this.state.isText))

    return (
      <div>
        {this.state.invalidFields.checkbox && <Callout intent={Intent.DANGER}>Action checkbox is required</Callout>}
        {hasInvalidInputs && <Callout intent={Intent.DANGER}>Inputs are required.</Callout>}
        {this.state.hasDuplicates && <Callout intent={Intent.DANGER}>Duplicated questions aren't allowed.</Callout>}
        {this.state.errorMessage && <Callout intent={Intent.DANGER}>{this.state.errorMessage}</Callout>}
        {missingTranslations && <Callout intent={Intent.DANGER}>Missing translations</Callout>}
        {this.state.isIncorrectRedirection && <Callout intent={Intent.DANGER}>Incorrect redirection</Callout>}
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

    this.props.isEditing ? this.onEdit(itemToSend) : this.onCreate(itemToSend)
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
    const { flows, flowsList, categories, isEditing, hideCategories } = this.props

    const currentFlow = flows ? flows.find(({ name }) => name === redirectFlow.value) || { nodes: [] } : { nodes: [] }
    const nodeList = currentFlow.nodes.map(({ name }) => ({ label: name, value: name }))

    return (
      <div>
        <div className={Classes.DIALOG_BODY}>
          <form>
            {this.alertMessage()}
            <QnaHint questions={this.itemQuestions} mlRecommendations={this.mlRecommendations} />

            {categories && !hideCategories && (
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
            )}

            <FormGroup helperText="Type/Paste your questions here separated with a new line" label="Questions">
              <TextArea
                id="input-questions"
                tabIndex={1}
                autoFocus
                value={this.itemQuestions.join('\n')}
                onChange={this.updateQuestions}
                fill
                rows={5}
                className={classnames({
                  qnaCategoryError:
                    invalidFields.questions || this.state.hasDuplicates || this.state.isIncorrectRedirection
                })}
              />
            </FormGroup>

            <H6>Answers</H6>
            <Checkbox
              label={'Bot will say: '}
              checked={!flowsList || this.state.isText}
              onChange={this.changeItemAction('isText')}
              tabIndex={-1}
            />

            <ElementsList
              placeholder="Type and press enter to add an answer. Use ALT+Enter for a new line"
              elements={this.itemAnswers}
              allowMultiline
              onInvalid={this.state.invalidFields.answer}
              onCreate={this.createAnswer}
              onUpdate={this.updateAnswer}
              onDelete={this.deleteAnswer}
            />

            {flowsList && (
              <React.Fragment>
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
                      tabIndex="-1"
                      value={this.state.item.redirectFlow}
                      options={flowsList}
                      onChange={this.handleSelect('redirectFlow')}
                      isDisabled={!this.state.isRedirect}
                    />
                  </div>
                  <div className={style.qnaRedirectNode}>
                    <strong>Node</strong>

                    <Select
                      className={classnames({ qnaCategoryError: invalidFields.redirectNode })}
                      tabIndex="-1"
                      value={this.state.item.redirectNode}
                      options={nodeList}
                      onChange={this.handleSelect('redirectNode')}
                      isDisabled={!this.state.isRedirect}
                    />
                  </div>
                </div>
              </React.Fragment>
            )}
          </form>
        </div>

        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button id="btn-cancel" text="Cancel" onClick={this.closeAndClear} />
            <AccessControl resource="module.qna" operation="write">
              <Button
                id="btn-submit"
                text={isEditing ? 'Save' : 'Add'}
                intent={Intent.PRIMARY}
                onClick={this.handleSubmit}
              />
            </AccessControl>
          </div>
        </div>
      </div>
    )
  }
}
