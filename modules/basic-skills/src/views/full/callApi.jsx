import React from 'react'
import { Alert, Tabs, Tab, Col, Row, Input, Label } from 'react-bootstrap'
import { BotpressTooltip } from 'botpress/tooltip'
import Select from 'react-select'

export class CallAPI extends React.Component {
  methodOptions = [
    { label: 'get', value: 'get' },
    { label: 'post', value: 'post' },
    { label: 'put', value: 'put' },
    { label: 'delete', value: 'delete' }
  ]

  state = {
    selectedMethod: undefined
  }

  onMethodChange = option => {
    this.setState({ selectedMethod: option })
  }

  render() {
    return (
      <div>
        <Row>
          <Label htmlFor="url">URL and endpoint</Label>
          <Input id="url" type="text" />
        </Row>
        <Row>
          <Label htmlFor="url">Method</Label>
          <Select options={methodOptions} value={this.state.selectedMethod} onChange={this.onMethodChange} />
        </Row>
        <Row>
          <Label htmlFor="url">Body</Label>
          <Input type="textarea" />
        </Row>
      </div>
    )
  }
}
