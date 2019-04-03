import React from 'react'
import { Row, Col, Label } from 'reactstrap'
import ContentPickerWidget from 'botpress/content-picker'
import Select from 'react-select'
import style from './style.scss'

export class Slot extends React.Component {
  state = {
    selectedIntentOption: undefined,
    selectedSlotOption: undefined,
    contentElement: undefined,
    intents: []
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
        contentElement: data.contentElement
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
      contentElement: this.state.contentElement,
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
              <Label for="contentPicker">Bot will say</Label>
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
        </div>
      </React.Fragment>
    )
  }
}
