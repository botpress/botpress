import React, { Component } from 'react'

import { FormGroup, FormControl, ButtonToolbar, Button, InputGroup, Glyphicon } from 'react-bootstrap'

import classnames from 'classnames'

import ArrayEditor from './ArrayEditor'
import style from './style.scss'

export default class QuestionsEditor extends Component {
  shouldAutofocus = false
  firstInput = null

  onQuestionChange = (index, onChange) => event => {
    onChange(event.target.value, index)
  }

  updateState = newState => {
    if (newState.items != null) {
      this.props.onChange(newState.items)
    }
  }

  addEmptyQuestion = () => {
    this.firstInput = null
    this.shouldAutofocus = true
    this.props.onChange([''].concat(this.props.items))
  }

  addInputOnEnter = event => {
    if (event.keyCode === 13 && this.firstInput.value) {
      // Enter pressed
      this.firstInput.removeEventListener('keyup', this.addInputOnEnter)
      this.addEmptyQuestion()
    }
  }

  onInputRendered = index => input => {
    if (!input || index !== 0) {
      return
    }

    if (!this.firstInput) {
      this.firstInput = input
      input.addEventListener('keyup', this.addInputOnEnter)
    }

    let shouldAutofocus = this.props.autofocus
    if (!shouldAutofocus && this.shouldAutofocus) {
      shouldAutofocus = true
      this.shouldAutofocus = false
    }
    shouldAutofocus && input.focus()
  }

  renderForm = (data, index, { values, onDelete, onChange }) => {
    if (index == null) {
      return (
        <div className={classnames(style.paddedRow, style.questionToolbar)}>
          <ButtonToolbar>
            <Button type="button" bsStyle="success" onClick={this.addEmptyQuestion}>
              <Glyphicon glyph="plus-sign" />&nbsp; Add another question
            </Button>
          </ButtonToolbar>
        </div>
      )
    }

    return (
      <FormGroup>
        <InputGroup>
          <FormControl
            inputRef={this.onInputRendered(index)}
            placeholder="Question"
            value={data}
            onChange={this.onQuestionChange(index, onChange)}
          />
          <InputGroup.Button>
            <Button
              type="button"
              bsStyle="danger"
              onClick={() => onDelete(index)}
              disabled={!values || values.length <= 1}
            >
              <Glyphicon glyph="remove-circle" />
            </Button>
          </InputGroup.Button>
        </InputGroup>
      </FormGroup>
    )
  }

  render() {
    return (
      <ArrayEditor
        items={this.props.items}
        renderItem={this.renderForm}
        updateState={this.updateState}
        createNewItem={() => ''}
      />
    )
  }
}
