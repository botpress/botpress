import React from 'react'
import { Row, Col, Label, Input } from 'reactstrap'
import Select from 'react-select'
import style from './style.scss'
import { BotpressTooltip } from 'botpress/tooltip'
import AceEditor from 'react-ace'

const methodOptions = [
  { label: 'get', value: 'get' },
  { label: 'post', value: 'post' },
  { label: 'put', value: 'put' },
  { label: 'delete', value: 'delete' }
]

export class CallAPI extends React.Component {
  state = {
    selectedMethod: undefined,
    body: undefined,
    url: undefined
  }

  componentDidMount() {
    const data = this.props.initialData
    if (data) {
      this.setState({
        selectedMethod: { value: data.method, label: data.method },
        body: data.body,
        url: data.url
      })
    }
  }

  componentDidUpdate() {
    if (this.state.url && this.state.selectedMethod) {
      const { selectedMethod, body, url } = this.state
      const data = {
        method: selectedMethod.value,
        body: body && body.trim(),
        url: url
      }

      this.props.onDataChanged && this.props.onDataChanged(data)
      this.props.onValidChanged && this.props.onValidChanged(true)
    }
  }

  handleMethodChange = option => {
    this.setState({ selectedMethod: option })
  }

  handleBodyChange = body => {
    this.setState({ body })
  }

  handleURLChange = event => {
    this.setState({ url: event.target.value })
  }

  render() {
    return (
      <div className={style.modalContent}>
        <Row>
          <Col md={9}>
            <Label for="url">URL</Label>
            <BotpressTooltip message="The complete URL and endpoint of the resource" />
            <Input id="url" type="text" onChange={this.handleURLChange} />
          </Col>
          <Col md={3}>
            <Label for="method">Method</Label>
            <BotpressTooltip message="The http method to use" />
            <Select
              id="method"
              options={methodOptions}
              value={this.state.selectedMethod}
              onChange={this.handleMethodChange}
            />
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <Label for="body">Body</Label>
            <BotpressTooltip message="The optional raw request body" />
            <AceEditor
              id="body"
              mode="json"
              height={250}
              width={700}
              value={this.state.body}
              onChange={this.handleBodyChange}
              editorProps={{ $blockScrolling: true }}
            />
          </Col>
        </Row>
      </div>
    )
  }
}
