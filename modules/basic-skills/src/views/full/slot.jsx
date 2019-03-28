import React from 'react'
import { Input, Row, Col, Label, Container, Button } from 'reactstrap'
import ContentPickerWidget from 'botpress/content-picker'
import Select from 'react-select'

export class Slot extends React.Component {
  state = {
    slotName: undefined,
    contentElement: undefined,
    contentType: undefined,
    selectedContexts: []
  }

  componentDidUpdate() {
    this.handleDataChange()
  }

  handleDataChange() {
    const data = {
      contentElement: this.state.contentElement,
      slotName: this.state.slotName,
      contexts: this.state.selectedContexts.map(c => c.value)
    }

    this.props.onDataChanged && this.props.onDataChanged(data)

    if (this.state.selectedContexts.length && this.state.slotName && this.state.contentElement) {
      this.props.onValidChanged && this.props.onValidChanged(true)
    }
  }

  handleContentChange = item => {
    this.setState({ contentElement: item.id })
  }

  handleSlotNameChange = event => {
    this.setState({ slotName: event.target.value })
  }

  handleContextsChange = selectedContexts => {
    this.setState({ selectedContexts })
  }

  render() {
    // TODO: Build options from contexts
    const options = [{ value: 'global', label: 'Global' }, { value: 'user-info', label: 'User Info' }]

    return (
      <React.Fragment>
        <Row>
          <Col>
            <Label for="selectContext">Context:</Label>
            <Select
              multi
              id="selectContext"
              name="selectContext"
              options={options}
              value={this.state.selectedContexts}
              onChange={this.handleContextsChange}
            />
          </Col>
        </Row>
        <Row>
          <Col>
            <Label for="contentPicker">Bot will say:</Label>
            <ContentPickerWidget
              name="contentPicker"
              id="contentPicker"
              itemId={this.state.contentElement}
              onChange={this.handleContentChange}
              placeholder="Pick content"
            />
          </Col>
        </Row>
        <Row>
          <Col>
            <Label for="slotName">Slot Name:</Label>
            <Input type="text" name="slotName" id="slotName" onChange={this.handleSlotNameChange} />
          </Col>
        </Row>
      </React.Fragment>
    )
  }
}
