import React from 'react'
import { Row, Col, Label, Input } from 'reactstrap'
import Select from 'react-select'
import style from './style.scss'
import { BotpressTooltip } from 'botpress/tooltip'
import { LinkDocumentationProvider } from 'botpress/documentation'

const methodOptions = [
  { label: 'get', value: 'get' },
  { label: 'post', value: 'post' },
  { label: 'put', value: 'put' },
  { label: 'delete', value: 'delete' }
]

const memoryOptions = [
  { label: 'Temp', value: 'temp' },
  { label: 'Session', value: 'session' },
  { label: 'Bot', value: 'bot' },
  { label: 'User', value: 'user' }
]

export class CallAPI extends React.Component {
  state = {
    selectedMethod: methodOptions[0],
    selectedMemory: memoryOptions[0],
    variable: 'response',
    body: undefined,
    url: undefined
  }

  componentDidMount() {
    const data = this.props.initialData
    if (data) {
      this.setState({
        selectedMethod: { value: data.method, label: data.method },
        selectedMemory: { value: data.memory, label: data.memory },
        variable: data.variable,
        body: data.body,
        url: data.url
      })
    }
  }

  componentDidUpdate() {
    if (this.state.url && this.state.selectedMethod) {
      const { selectedMethod, selectedMemory, body, url, variable } = this.state
      const data = {
        method: selectedMethod.value,
        memory: selectedMemory.value,
        body,
        url,
        variable
      }

      this.props.onDataChanged && this.props.onDataChanged(data)
      this.props.onValidChanged && this.props.onValidChanged(true)
    }
  }

  handleMethodChange = option => {
    this.setState({ selectedMethod: option })
  }

  handleBodyChange = event => {
    this.setState({ body: event.target.value })
  }

  handleURLChange = event => {
    this.setState({ url: event.target.value })
  }

  handleMemoryChange = option => {
    this.setState({ selectedMemory: option })
  }

  handleVariableChange = event => {
    this.setState({ variable: event.target.value })
  }

  render() {
    const paramsHelp = <LinkDocumentationProvider file="memory" />

    return (
      <div className={style.modalContent}>
        <Row>
          <Col md={12}>
            <Label for="url">Enter the resource URL</Label>
            <Input
              id="url"
              type="text"
              placeholder="Resource URL"
              value={this.state.url}
              onChange={this.handleURLChange}
            />
          </Col>
        </Row>
        <Row>
          <Col md={4}>
            <Label for="method">Choose an HTTP Method</Label>
            <Select
              id="method"
              default
              style={{ zIndex: 1000 }}
              options={methodOptions}
              value={this.state.selectedMethod}
              onChange={this.handleMethodChange}
            />
          </Col>
          <Col md={4}>
            <Label>Choose a memory type</Label>
            {paramsHelp}
            <Select
              id="storageSelect"
              options={memoryOptions}
              value={this.state.selectedMemory}
              onChange={this.handleMemoryChange}
            />
          </Col>
          <Col md={4}>
            <Label>Variable</Label>
            <BotpressTooltip message="Enter a name for the variable that will hold the response" />
            <Input type="text" value={this.state.variable} onChange={this.handleVariableChange} />
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <Label for="body">Body (optional)</Label>
            <BotpressTooltip message="Enter the request body" />
            <Input type="textarea" rows="4" id="body" value={this.state.body} onChange={this.handleBodyChange} />
          </Col>
        </Row>
        <br />
      </div>
    )
  }
}
