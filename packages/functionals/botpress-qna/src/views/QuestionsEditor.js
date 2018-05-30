import React, { Component } from 'react'

import { FormGroup, FormControl, ButtonToolbar, Button, InputGroup, Glyphicon } from 'react-bootstrap'

import classnames from 'classnames'

import ArrayEditor from './ArrayEditor'
import style from './style.scss'

export default class QuestionsEditor extends Component {
  onQuestionChange = (index, onChange) => event => {
    onChange(event.target.value, index)
  }

  updateState = newState => {
    if (newState.items != null) {
      this.props.onChange(newState.items)
    }
  }

  addEmptyQuestion = () => {
    this.props.onChange([''].concat(this.props.items))
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
            inputRef={input => {
              input && this.props.autofocus && index === 0 && input.focus()
            }}
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
