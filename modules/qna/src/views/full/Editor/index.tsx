import { Button, Callout, Checkbox, Classes, FormGroup, H6, Intent, TextArea } from '@blueprintjs/core'
// @ts-ignore
import ElementsList from 'botpress/elements-list'
import { Flow, FlowNode } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import { AccessControl, getFlowLabel } from 'botpress/utils'
import classnames from 'classnames'
import _ from 'lodash'
import some from 'lodash/some'
import React, { Component } from 'react'
import Select from 'react-select'

import style from '../style.scss'
import { ContextSelector } from '../ContextSelector'
import QnaHint from '../QnaHint'

export const ACTIONS = {
  TEXT: 'text',
  REDIRECT: 'redirect',
  TEXT_REDIRECT: 'text_redirect'
}

export interface Filter {
  question?: string
  contexts?: string[]
}

export interface Paging {
  offset: number
  limit: number
}

export interface Props {
  closeQnAModal: () => void
  fetchData: () => void
  updateQuestion: (data: any) => void
  page: Paging
  filters: Filter
  id: string
  hideContexts?: boolean
  isLite?: boolean
  isEditing: boolean
  contentLang: string
  contexts?: string[]
  defaultContext?: string
  bp: any
  flowsList?: { label: string; value: string }[]
  flows?: Flow[]
}

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
        enabled: true,
        contexts: this.props.defaultContext ? [this.props.defaultContext] : []
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

    item.contexts = item.contexts || []
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
    qnaItem.redirectFlow = qnaItem.redirectFlow.value
    qnaItem.redirectNode = qnaItem.redirectNode.value
    const {
      page,
      filters: { question, contexts }
    } = this.props

    try {
      const { data } = await this.props.bp.axios.post(`/mod/qna/questions/${this.props.id}`, qnaItem, {
        params: { ...page, question, filteredContexts: contexts }
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
        {this.state.invalidFields.checkbox && (
          <Callout intent={Intent.DANGER}>{lang.tr('module.qna.editor.checkRequired')}</Callout>
        )}
        {hasInvalidInputs && <Callout intent={Intent.DANGER}>{lang.tr('module.qna.editor.inputsRequred')}</Callout>}
        {this.state.hasDuplicates && (
          <Callout intent={Intent.DANGER}>{lang.tr('module.qna.editor.duplicatesNotAllowed')}</Callout>
        )}
        {this.state.errorMessage && <Callout intent={Intent.DANGER}>{this.state.errorMessage}</Callout>}
        {missingTranslations && (
          <Callout intent={Intent.DANGER}>{lang.tr('module.qna.editor.missingTranslations')}</Callout>
        )}
        {this.state.isIncorrectRedirection && (
          <Callout intent={Intent.DANGER}>{lang.tr('module.qna.editor.incorrectRedirection')}</Callout>
        )}
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
    const { flows, flowsList, isEditing, hideContexts } = this.props

    const currentFlow = flows ? flows.find(({ name }) => name === redirectFlow.value) || { nodes: [] } : { nodes: [] }
    const nodeList = (currentFlow.nodes as FlowNode[])?.map(({ name }) => ({ label: name, value: name }))

    return (
      <div>
        <div className={Classes.DIALOG_BODY}>
          <form>
            {this.alertMessage()}
            <QnaHint questions={this.itemQuestions} mlRecommendations={this.mlRecommendations} />

            {!hideContexts && (
              <ContextSelector
                contexts={this.state.item.contexts}
                saveContexts={this.handleSelect('contexts')}
                bp={this.props.bp}
              />
            )}

            <FormGroup
              helperText={lang.tr('module.qna.editor.pasteQuestionHere')}
              label={lang.tr('module.qna.editor.questions')}
            >
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

            <H6>{lang.tr('module.qna.editor.answers')}</H6>
            <Checkbox
              label={lang.tr('module.qna.editor.botWillSay')}
              checked={!flowsList || this.state.isText}
              onChange={this.changeItemAction('isText')}
              tabIndex={-1}
            />

            <ElementsList
              placeholder={lang.tr('module.qna.editor.typePressAddAnswer')}
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
                  <div className={style.qnaAndOrText}>{lang.tr('module.qna.editor.andOr')}</div>
                  <div className={style.qnaAndOrLine} />
                </div>
                <div className={style.qnaRedirect}>
                  <div className={style.qnaRedirectToFlow}>
                    <Checkbox
                      label={lang.tr('module.qna.editor.redirectToFlow')}
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
                    <strong>{lang.tr('module.qna.editor.node')}</strong>

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
            <Button id="btn-cancel" text={lang.tr('cancel')} onClick={this.closeAndClear} />
            <AccessControl resource="module.qna" operation="write">
              <Button
                id="btn-submit"
                text={isEditing ? lang.tr('save') : lang.tr('add')}
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
