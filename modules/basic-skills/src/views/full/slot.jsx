import React from 'react'
import { Row, Col, Label, Input } from 'reactstrap'
import ContentPickerWidget from 'botpress/content-picker'
import Select from 'react-select'
import style from './style.scss'

export class Slot extends React.Component {
  state = {
    selectedIntentOption: undefined,
    selectedSlotOption: undefined,
    selectedValidationOption: undefined,
    contentElement: undefined,
    notFoundElement: undefined,
    intents: [],
    addValidation: false,
    maxRetryAttempts: 3
  }

  componentDidMount() {
    this.props.bp.axios.get('/mod/nlu/intents').then(response => {
      this.setState({
        intents: response.data
      })
    })

    const data = this.props.initialData
    if (data) {
      this.setState({
        selectedSlotOption: { value: data.slotName, label: data.slotName },
        selectedIntentOption: { value: data.intent, label: data.intent },
        contentElement: data.contentElement,
        notFoundElement: data.notFoundElement
      })
    }
  }

  componentDidUpdate() {
    const intentName = this.state.selectedIntentOption && this.state.selectedIntentOption.value
    const intent = intentName && this.state.intents.find(x => x.name === intentName)
    const slotName = this.state.selectedSlotOption && this.state.selectedSlotOption.value
    const slot = intent && intent.slots.find(x => x.name === slotName)
    const entity = slot && slot.entity

    const data = {
      validationRegex: this.state.validationRegex,
      retryAttempts: this.state.maxRetryAttempts,
      contentElement: this.state.contentElement,
      notFoundElement: this.state.notFoundElement,
      slotName,
      intent: intentName,
      entity,
      contexts: intent && intent.contexts
    }

    if (this.state.selectedIntentOption && this.state.selectedSlotOption && this.state.contentElement) {
      this.props.onDataChanged && this.props.onDataChanged(data)
      this.props.onValidChanged && this.props.onValidChanged(true)
    }
  }

  handleContentChange = item => {
    this.setState({ contentElement: item.id })
  }

  handleSlotChange = selectedSlotOption => {
    this.setState({ selectedSlotOption })
  }

  handleIntentChange = selectedIntentOption => {
    this.setState({ selectedIntentOption, selectedSlotOption: undefined })
  }

  handleNotFoundChange = item => {
    this.setState({ notFoundElement: item.id })
  }

  handleMaxRetryAttemptsChange = event => {
    const value = Number(event.target.value)
    if (isNaN(value)) {
      return
    }

    this.setState({ maxRetryAttempts: value })
  }

  toggleAddValidation = () => {
    this.setState({ addValidation: !this.state.addValidation })
  }

  render() {
    const intentName = this.state.selectedIntentOption && this.state.selectedIntentOption.value
    const intent = this.state.intents.find(x => x.name === intentName)
    const slotOptions =
      intent &&
      intent.slots.map(slot => {
        return { value: slot.name, label: slot.name }
      })

    return (
      <React.Fragment>
        <div className={style.modalContent}>
          <Row>
            <Col>
              <Label>Choose an intent</Label>
              <Select
                id="intent"
                name="intent"
                className={style.intentSelect}
                isSearchable={true}
                onChange={this.handleIntentChange}
                value={this.state.selectedIntentOption}
                options={this.state.intents.map(intent => {
                  return { value: intent.name, label: intent.name }
                })}
              />
            </Col>
          </Row>
          <Row>
            <Col>
              <Label for="slotName">Choose a slot to fill</Label>
              <Select
                id="slot"
                name="slot"
                className={style.slotSelect}
                isSearchable={true}
                onChange={this.handleSlotChange}
                value={this.state.selectedSlotOption}
                options={slotOptions}
              />
            </Col>
          </Row>
          <Row>
            <Col>
              <Label for="contentPicker">Bot will ask</Label>
              <ContentPickerWidget
                name="contentPicker"
                id="contentPicker"
                className={style.contentPicker}
                itemId={this.state.contentElement}
                onChange={this.handleContentChange}
                placeholder="Pick content"
              />
            </Col>
          </Row>
          <Row>
            <Col>
              <Input type="checkbox" id="validationCheck" name="validationCheck" onChange={this.toggleAddValidation} />
              &nbsp;
              <Label for="validationCheck">Input validation action</Label>
              {this.state.addValidation && (
                <Select
                  id="validation"
                  name="validation"
                  className={style.slotSelect}
                  isSearchable={true}
                  value={this.state.selectedValidationOption}
                  options={[
                    { value: 'email', label: 'Email' },
                    { value: 'phone', label: 'Phone' },
                    { value: 'custom', label: 'Custom' }
                  ]}
                />
              )}
            </Col>
          </Row>
          <Row>
            <Col md="9">
              <Label>Not Found Message</Label>
              <ContentPickerWidget
                name="notFoundElement"
                id="notFoundElement"
                itemId={this.state.notFoundElement}
                onChange={this.handleNotFoundChange}
                placeholder="Pick content to display when the slot is not found"
              />
            </Col>
            <Col md="3">
              <Label for="retryAttempts">Max retry attempts</Label>
              <Input
                id="retryAttempts"
                name="retryAttempts"
                type="numeric"
                value={this.state.maxRetryAttempts}
                onChange={this.handleMaxRetryAttemptsChange}
              />
            </Col>
          </Row>
        </div>
      </React.Fragment>
    )
  }
}
