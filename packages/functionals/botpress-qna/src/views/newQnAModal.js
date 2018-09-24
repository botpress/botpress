import React, { Component } from 'react'
import { FormControl, Button, Modal, Alert } from 'react-bootstrap'
import classnames from 'classnames'

import Select from 'react-select'
import style from './style.scss'

const ACTIONS = {
  TEXT: 'text',
  REDIRECT: 'redirect',
  TEXT_REDIRECT: 'text_redirect'
}

export default class NewQnAModal extends Component {
  static defaultState() {
    return {
      newItem: {
        questions: '',
        answer: '',
        redirectflow: '',
        redirectnode: '',
        action: ACTIONS.TEXT,
        category: '',
        enabled: true
      },
      valideFileds: {
        category: true,
        questions: true,
        answer: true,
        checkbox: true,
        redirectflow: true,
        redirectnode: true
      },
      isText: true,
      isRedirect: false,
      isValidForm: true
    }
  }

  static cleanupQuestions = questions =>
    questions
      .split(/\n/)
      .map(q => q.trim())
      .filter(Boolean)

  constructor(props) {
    super(props)

    this.state = NewQnAModal.defaultState()
  }

  componentDidUpdate(prevProps) {
    const { id } = this.props

    if (id && prevProps.id !== id) {
      this.props.bp.axios.get(`/api/botpress-qna/${id}`).then(({ data }) => {
        const { answer, questions, metadata } = data
        const item = {
          answer,
          questions: questions.join('\n')
        }

        metadata.forEach(({ name, value }) => {
          item[name] = value
        })

        this.setState({ newItem: item, isRedirect: item.redirectflow && item.redirectnode, isText: item.answer })
      })
    }
  }

  changeItemProperty = (key, value) => {
    const { newItem } = this.state

    this.setState({
      newItem: {
        ...newItem,
        [key]: value
      }
    })
  }

  handleSelect = key => ({ value }) => this.changeItemProperty(key, value)

  changeItemAction = actionType => () => {
    this.setState({ [actionType]: !this.state[actionType] }, () => {
      const { isText, isRedirect } = this.state
      const action = isText && isRedirect ? ACTIONS.TEXT_REDIRECT : isRedirect ? ACTIONS.REDIRECT : ACTIONS.TEXT

      this.changeItemProperty('action', action)
    })
  }

  validateForm() {
    const { hasCategory, categories } = this.props
    const { newItem, isText, isRedirect } = this.state
    const categoryWrapper = hasCategory ? { category: !categories.length || newItem.category } : {}
    const valideFileds = {
      ...categoryWrapper,
      questions: newItem.questions,
      answer: !this.state.isText || this.state.newItem.answer,
      checkbox: isText || isRedirect,
      redirectflow: !this.state.isRedirect || this.state.newItem.redirectflow,
      redirectnode: !this.state.isRedirect || this.state.newItem.redirectnode
    }

    this.setState({ valideFileds })

    for (const filed in valideFileds) {
      if (!valideFileds[filed]) {
        return true
      }
    }

    return false
  }

  onCreate = event => {
    event.preventDefault()
    if (this.validateForm()) {
      this.setState({ isValidForm: false })

      return
    }

    if (!this.state.isValidForm) {
      this.setState({ isValidForm: true })
    }

    const newItem = {
      ...this.state.newItem,
      questions: this.state.newItem.questions.split(/\n/)
    }

    return this.props.bp.axios.post('/api/botpress-qna', newItem).then(() => {
      this.onClose()
      this.props.fetchData()
    })
  }

  onEdit = event => {
    event.preventDefault()
    if (this.validateForm()) {
      this.setState({ isValidForm: false })

      return
    }

    if (!this.state.isValidForm) {
      this.setState({ isValidForm: true })
    }

    const newItem = {
      ...this.state.newItem,
      questions: this.state.newItem.questions.split(/\n/)
    }

    return this.props.bp.axios.put(`/api/botpress-qna/${this.props.id}`, newItem).then(() => {
      this.onClose()
      this.props.fetchData()
    })
  }

  onClose = () => {
    this.setState(NewQnAModal.defaultState())
    this.props.toggleQnAModal()
  }

  alertMessage() {
    if (this.state.isValidForm) {
      return null
    }

    const isValidInputs = Object.values(this.state.valideFileds).find(Boolean)

    return (
      <div>
        {!this.state.valideFileds.checkbox ? <Alert bsStyle="danger">Action checkbox is required</Alert> : null}
        {isValidInputs ? <Alert bsStyle="danger">Inputs are required</Alert> : null}
      </div>
    )
  }

  render() {
    const { newItem: { redirectflow }, valideFileds } = this.state
    const { flows, flowsList, showQnAModal, categories, modalType } = this.props
    const currentFlow = flows ? flows.find(({ name }) => name === redirectflow) || { nodes: [] } : { nodes: [] }
    const nodeList = currentFlow.nodes.map(({ name }) => ({ label: name, value: name }))
    const isEdit = modalType === 'edit'

    return (
      <Modal className={`${style['new-qna-modal']} new-qna-modal`} show={showQnAModal} onHide={this.onClose}>
        <form onSubmit={!isEdit ? this.onCreate : this.onEdit}>
          <Modal.Header className={style['qna-modal-header']}>
            <Modal.Title>{!isEdit ? 'Create a new' : 'Edit'} Q&A</Modal.Title>
          </Modal.Header>

          <Modal.Body className={style['qna-modal-body']}>
            {this.alertMessage()}
            {this.props.hasCategory ? (
              <div className={style['qna-category']}>
                <span className={style['qna-category__title']}>Category</span>
                <Select
                  className={classnames(style['qna-category__select'], {
                    'qna-category-error': !valideFileds.category
                  })}
                  value={this.state.newItem.category}
                  options={categories}
                  onChange={this.handleSelect('category')}
                  placeholder="Search or choose category"
                />
              </div>
            ) : null}
            <div className={style['qna-questions']}>
              <span className={style['qna-questions__title']}>Questions</span>
              <span className={style['qna-questions__hint']}>
                Type/Paste your questions here separated with a new line
              </span>
              <FormControl
                className={classnames(style['qna-questions__textarea'], {
                  'qna-category-error': !valideFileds.questions
                })}
                value={this.state.newItem.questions}
                onChange={event => this.changeItemProperty('questions', event.target.value)}
                componentClass="textarea"
              />
            </div>
            <div className={style['qna-reply']}>
              <span className={style['qna-reply__title']}>Reply with:</span>
              <div className={style['qna-answer']}>
                <span className={style['qna-answer__check']}>
                  <input type="checkbox" checked={this.state.isText} onChange={this.changeItemAction('isText')} />&nbsp;
                  Type your answer
                </span>
                <FormControl
                  className={classnames(style['qna-answer__textarea'], {
                    'qna-category-error': !valideFileds.answer
                  })}
                  value={this.state.newItem.answer}
                  onChange={event => this.changeItemProperty('answer', event.target.value)}
                  componentClass="textarea"
                />
              </div>
              <div className={style['qna-and-or']}>
                <div className={style['qna-and-or__line']} />
                <div className={style['qna-and-or__text']}>and / or</div>
                <div className={style['qna-and-or__line']} />
              </div>
              <div className={style['qna-redirect']}>
                <div className={style['qna-redirect-to-flow']}>
                  <span className={style['qna-redirect-to-flow-check']}>
                    <input
                      type="checkbox"
                      checked={this.state.isRedirect}
                      onChange={this.changeItemAction('isRedirect')}
                      className={style['qna-redirect-to-flow-check__checkbox']}
                    />&nbsp;Redirect to flow
                  </span>
                  <Select
                    className={classnames(style['qna-redirect-to-flow-check__select'], {
                      'qna-category-error': !valideFileds.redirectflow
                    })}
                    value={this.state.newItem.redirectflow}
                    options={flowsList}
                    onChange={this.handleSelect('redirectflow')}
                  />
                </div>
                <div className={style['qna-redirect-node']}>
                  <span className={style['qna-redirect-node__title']}>Node</span>
                  <Select
                    className={classnames(style['qna-redirect-node__select'], {
                      'qna-category-error': !valideFileds.redirectnode
                    })}
                    value={this.state.newItem.redirectnode}
                    options={nodeList}
                    onChange={this.handleSelect('redirectnode')}
                  />
                </div>
              </div>
            </div>
          </Modal.Body>

          <Modal.Footer className={style['qna-modal-footer']}>
            <Button className={style['qna-modal-footer__cancel-btn']} onClick={this.onClose}>
              Cancel
            </Button>
            <Button className={style['qna-modal-footer__save-btn']} type="submit">
              {isEdit ? 'Edit' : 'Save'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    )
  }
}
