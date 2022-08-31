import { Tab, Tabs, Callout, Label, Classes, TextArea, Icon } from '@blueprintjs/core'
import classnames from 'classnames'
import { nanoid } from 'nanoid'
import React from 'react'
import Select from 'react-select'

import { TipLabel } from './TipLabel'
import style from './style.scss'

const methodOptions = [
  { label: 'Get', value: 'get' },
  { label: 'Post', value: 'post' },
  { label: 'Put', value: 'put' },
  { label: 'Delete', value: 'delete' }
]

const memoryOptions = [
  { label: 'Temp', value: 'temp' },
  { label: 'Session', value: 'session' },
  { label: 'Bot', value: 'bot' },
  { label: 'User', value: 'user' }
]

const stringify = obj => {
  return JSON.stringify(obj, null, 2)
}

// Example of how to format headers in JSON
const headersPlaceholder = stringify({
  Authorization: '<value>',
  'Content-Type': '<value>',
  'X-Custom-Headers': '<value>'
})

export class CallAPI extends React.Component {
  state = {
    selectedMethod: methodOptions[0],
    selectedMemory: memoryOptions[0],
    variable: 'response',
    body: undefined,
    randomId: nanoid('abcdefghijklmnopqrstuvwxyz0123456789', 10),
    headers: undefined,
    url: undefined,
    invalidJson: false
  }

  getInitialDataProps = propsKey => this.props.initialData[propsKey]
  getOrDefault = (propsKey, stateKey) => this.getInitialDataProps(propsKey) || this.state[stateKey]
  createSelectOption = data => (data ? { value: data, label: data } : undefined)

  componentDidMount() {
    if (this.props.initialData) {
      this.setState({
        selectedMethod: this.createSelectOption(this.getInitialDataProps('method')) || this.state.selectedMethod,
        selectedMemory: this.createSelectOption(this.getInitialDataProps('memory')) || this.state.selectedMemory,
        randomId: this.getOrDefault('randomId', 'randomId'),
        headers: stringify(this.getInitialDataProps('headers')) || this.state.headers,
        variable: this.getOrDefault('variable', 'variable'),
        body: this.getOrDefault('body', 'body'),
        url: this.getOrDefault('url', 'url')
      })
    }
  }

  componentDidUpdate() {
    const { selectedMethod, selectedMemory, body, url, variable, invalidJson, headers } = this.state
    if (url && selectedMethod && selectedMemory && variable && !invalidJson) {
      const data = {
        method: selectedMethod.value,
        memory: selectedMemory.value,
        randomId: this.state.randomId,
        body,
        headers: headers ? JSON.parse(headers) : undefined,
        url,
        variable,
        invalidJson
      }

      this.props.onDataChanged && this.props.onDataChanged(data)
      this.props.onValidChanged && this.props.onValidChanged(true)
    }
  }

  handleHeadersChange = event => {
    const value = event.target.value

    try {
      if (value !== '') {
        JSON.parse(value) // Only to validate
      }
      this.setState({ headers: value, invalidJson: false })
    } catch (e) {
      this.setState({ headers: value, invalidJson: true })
    }
  }

  handleInputChange = event => {
    this.setState({ [event.target.name]: event.target.value })
  }

  handleMemoryChange = option => {
    this.setState({ selectedMemory: option })
  }

  handleMethodChange = option => {
    this.setState({ selectedMethod: option })
  }

  render() {
    return (
      <div className={style.modalContent}>
        <div className={style.skillSection}>
          <div style={{ flex: `${2 / 12}` }}>
            <Select
              id="method"
              default
              style={{ zIndex: 1000 }}
              options={methodOptions}
              value={this.state.selectedMethod}
              onChange={this.handleMethodChange}
            />
          </div>
          <div style={{ flex: `${9.5 / 12}` }}>
            <input
              className={classnames(Classes.INPUT, Classes.FILL, Classes.LARGE)}
              id="url"
              name="url"
              type="text"
              placeholder="Enter request URL"
              value={this.state.url}
              onChange={this.handleInputChange}
            />
          </div>
        </div>
        <Tabs id="requestOptionsTabs" animate={false} defaultSelectedTabId="body" className={style.callApiTabs}>
          <Tab
            id="body"
            title="Body"
            panel={
              <div>
                <Callout className={style.callApiNote}>
                  Send a request body. Enter the raw payload of the request. Make sure it has proper formatting based on
                  your Content-Type. E.g. application/json content type should respect the JSON format.
                </Callout>
                <TextArea
                  fill
                  growVertically
                  id="body"
                  name="body"
                  className={style.callApiTextArea}
                  value={this.state.body}
                  onChange={this.handleInputChange}
                />
              </div>
            }
          />
          <Tab
            id="headers"
            title="Headers"
            panel={
              <div>
                <Callout className={style.callApiNote}>Send request headers. Write in JSON format.</Callout>
                <TextArea
                  fill
                  growVertically
                  id="headers"
                  name="headers"
                  className={style.callApiTextArea}
                  placeholder={headersPlaceholder}
                  value={this.state.headers}
                  onChange={this.handleHeadersChange}
                />
                {this.state.invalidJson && (
                  <div className={style.callApiWarning}>
                    <Icon icon="warning-sign" />
                    Invalid JSON format
                  </div>
                )}
              </div>
            }
          />
          <Tab
            id="variable"
            title="Memory"
            panel={
              <div>
                <Callout className={style.callApiNote}>
                  {
                    'Store the response body in {{temp.response}} by default. You can change the memory type and the variable here.'
                  }
                </Callout>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ flex: `${2 / 12}` }}>
                    <label htmlFor="storageSelect" className={style.tipLabel}>
                      Memory type
                    </label>
                    <Select
                      name="storageSelect"
                      id="storageSelect"
                      options={memoryOptions}
                      value={this.state.selectedMemory}
                      onChange={this.handleMemoryChange}
                    />
                  </div>
                  <div style={{ flex: `${9.5 / 12}` }}>
                    <TipLabel
                      htmlFor="variable"
                      labelText="Variable"
                      tooltipText="The response body will be assigned to this variable"
                    />
                    <input
                      type="text"
                      className={classnames(Classes.INPUT, Classes.LARGE, Classes.FILL)}
                      name="variable"
                      value={this.state.variable}
                      onChange={this.handleInputChange}
                    />
                  </div>
                </div>
              </div>
            }
          />
        </Tabs>
      </div>
    )
  }
}
