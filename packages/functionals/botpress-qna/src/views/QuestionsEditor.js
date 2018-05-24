import React, { Component, Fragment } from 'react'

import { FormGroup, FormControl, Panel, ButtonToolbar, Button } from 'react-bootstrap'

import ArrayEditor from './ArrayEditor'

export default class QuestionsEditor extends Component {
  onQuestionChange = (index, onChange) => event => {
    onChange(event.target.value, index)
  }

  updateState = newState => {
    if (newState.newItem != null) {
      this.setState({ newItem: newState.newItem })
    }
    if (newState.items != null) {
      this.props.onChange(newState.items)
    }
  }

  addEmptyQuestion = () => {
    this.props.onChange([''].concat(this.props.items))
  }

  renderForm = (data, index, { onDelete, onChange }) => {
    if (index == null) {
      return (
        <ButtonToolbar>
          <Button type="button" bsStyle="success" onClick={this.addEmptyQuestion}>
            Add another question
          </Button>
        </ButtonToolbar>
      )
    }

    return (
      <Fragment>
        <FormGroup>
          <FormControl
            componentClass="textarea"
            placeholder="Question"
            value={data}
            onChange={this.onQuestionChange(index, onChange)}
          />
        </FormGroup>

        <ButtonToolbar>
          <Button type="button" bsSize="sm" bsStyle="danger" onClick={() => onDelete(index)}>
            Delete
          </Button>
        </ButtonToolbar>
      </Fragment>
    )
  }

  render() {
    return (
      <Panel>
        <Panel.Body>
          <ArrayEditor
            items={this.props.items}
            renderItem={this.renderForm}
            updateState={this.updateState}
            createNewItem={() => ''}
          />
        </Panel.Body>
      </Panel>
    )
  }
}
