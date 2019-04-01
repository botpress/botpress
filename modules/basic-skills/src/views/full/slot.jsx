import React from 'react'
import { Input, Row, Col, Label } from 'reactstrap'
import ContentPickerWidget from 'botpress/content-picker'
import Select from 'react-select'
import style from './style.scss'

export class Slot extends React.Component {
  state = {
    slotName: undefined,
    contentElement: undefined,
    selectedContexts: [],
    contextsOptions: []
  }

  componentDidMount() {
    this.props.bp.axios.get(`/contexts`).then(response => {
      // react-select expect options to have a value AND a label
      const contextsOptions = response.data.map(context => {
        return { value: context, label: context }
      })
      this.setState({ contextsOptions })
    })

    const data = this.props.initialData
    if (data) {
      this.setState({
        slotName: data.slotName,
        selectedContexts: data.contexts,
        contentElement: data.contentElement
      })
    }
  }

  componentDidUpdate() {
    this.handleDataChange()
  }

  handleDataChange() {
    const data = {
      contentElement: this.state.contentElement,
      slotName: this.state.slotName,
      contexts: this.state.selectedContexts.length && this.state.selectedContexts.map(c => c.value)
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
    return (
      <React.Fragment>
        <div className={style.modalContent}>
          <Row>
            <Col>
              <Label for="selectContext">Context:</Label>
              <Select
                multi
                className={style.multiSelect}
                id="selectContext"
                name="selectContext"
                options={this.state.contextsOptions}
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
              <Input
                type="text"
                name="slotName"
                id="slotName"
                value={this.state.slotName || ''}
                onChange={this.handleSlotNameChange}
              />
            </Col>
          </Row>
        </div>
      </React.Fragment>
    )
  }
}
